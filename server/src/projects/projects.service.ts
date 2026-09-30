
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomResponse } from '../common/responses/custom.response';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectFlowDto } from './dto/create-project-flow.dto';
import { ListProjectsDto } from './dto/list-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        organization: {
            connect: { id: createProjectDto.orgId }
        },
        ...(createProjectDto.creatorId
          ? { creator: { connect: { id: createProjectDto.creatorId } } }
          : {}),
      },
    });
  }

  async findAll(orgId: number | null, user: any, dto: ListProjectsDto = new ListProjectsDto()) {
    if (!orgId) return [];
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    // 未传分页参数时保持旧行为（全量返回），兼容未升级的旧客户端
    const paged = dto.page !== undefined || dto.pageSize !== undefined;

    const where = { orgId };
    // 工时聚合下推到数据库，避免全量加载 workRecords 到内存 reduce
    const [projects, total, hoursAgg, daysAgg, userMember] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { id: 'asc' },
        include: { _count: { select: { projectMembers: true } } },
        ...(paged ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.project.count({ where }),
      this.prisma.workRecord.groupBy({
        by: ['projectId'],
        where: { project: { orgId }, wageTypeSnapshot: 'hour' },
        _sum: { duration: true },
      }),
      this.prisma.workRecord.groupBy({
        by: ['projectId'],
        where: { project: { orgId }, wageTypeSnapshot: { in: ['day', 'month'] } },
        _sum: { duration: true },
      }),
      this.prisma.organizationMember.findFirst({
        where: { orgId, userId: user.sub },
      }),
    ]);

    // 当前用户作为项目负责人的项目（用于 role 判定）
    const projectIds = projects.map((p: any) => p.id);
    const ownerMemberships = projectIds.length
      ? await this.prisma.projectMember.findMany({
          where: { projectId: { in: projectIds }, role: 'owner', member: { userId: user.sub } },
          select: { projectId: true },
        })
      : [];
    const ownerProjectIds = new Set(ownerMemberships.map((m: any) => m.projectId));

    const hoursMap = new Map(hoursAgg.map((a: any) => [a.projectId, a._sum.duration ?? 0]));
    const daysMap = new Map(daysAgg.map((a: any) => [a.projectId, a._sum.duration ?? 0]));

    // Map to match frontend Project interface with stats
    const list = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      role: ownerProjectIds.has(p.id) ? 'owner' : (userMember?.role || 'member'),
      memberCount: p._count.projectMembers,
      totalHours: hoursMap.get(p.id) ?? 0,
      totalDaysHours: daysMap.get(p.id) ?? 0,
    }));

    // data 保持数组格式（兼容旧客户端），分页信息放在 pagination
    return paged
      ? CustomResponse.success(list, {}, { total, pageSize, currentPage: page })
      : CustomResponse.success(list);
  }

  async findOne(id: number, user: any) {
    const p: any = await this.prisma.project.findUnique({
      where: { id },
      include: {
        projectMembers: {
          include: { member: { include: { user: { select: { name: true } } } } },
        },
        creator: { select: { name: true } },
      },
    });

    if (!p) return null;

    // Get current user's organization member record
    const [hoursAgg, daysAgg, userMember] = await Promise.all([
      this.prisma.workRecord.aggregate({
        where: { projectId: id, wageTypeSnapshot: 'hour' },
        _sum: { duration: true },
      }),
      this.prisma.workRecord.aggregate({
        where: { projectId: id, wageTypeSnapshot: { in: ['day', 'month'] } },
        _sum: { duration: true },
      }),
      this.prisma.organizationMember.findFirst({
        where: {
          orgId: p.orgId,
          userId: user.sub
        }
      }),
    ]);

    // Check if current user is project owner
    const isOwner = p.projectMembers.some((pm: any) =>
      pm.member?.userId === user.sub && pm.role === 'owner'
    );

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      ownerName: p.creator?.name || '',
      role: isOwner ? 'owner' : (userMember?.role || 'member'), // Determine role based on org membership
      memberCount: p.projectMembers.length,
      totalHours: hoursAgg._sum.duration ?? 0,
      totalDaysHours: daysAgg._sum.duration ?? 0,
    };
  }

  async addMembers(id: number, dto: AddProjectMembersDto, user: any) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    if (user.systemRole !== 'admin') {
      if (project.orgId !== user.orgId) {
        throw new ForbiddenException('Project does not belong to your current organization');
      }
      const currentMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: user.orgId, userId: user.sub }
      });
      if (!currentMember || !['owner', 'admin', 'leader'].includes(currentMember.role)) {
        throw new ForbiddenException('Only owner, admin, or leader can add members');
      }
    }

    const creates = dto.memberIds.map(memberId => ({
        projectId: id,
        memberId: memberId,
        role: 'member'
    }));
    
    // Ignore duplicates using createMany with skipDuplicates (if supported by DB) or loop
    // SQLite supports skipDuplicates in createMany only recently, let's use loop for safety or transaction
    for (const data of creates) {
        try {
            await this.prisma.projectMember.create({ data });
        } catch (e) {
            // Ignore unique constraint violations
        }
    }
    return { success: true };
  }

  async getMembers(id: number) {
    const projectId = Number(id);
    const memberships = await this.prisma.projectMember.findMany({
      where: { projectId: projectId },
      include: {
        member: {
            include: { user: true }
        }
      }
    });

    return memberships.map(m => ({
        id: m.member.id,
        name: m.member.user?.name || m.member.user?.phone,
        role: m.member.role, // Org role
        wageType: m.member.wageType,
        wageAmount: m.member.wageAmount, // 单位：分；<=0 视为未设工资，小程序记工时需拦截
        avatar: m.member.user?.avatar || ''
    }));
  }

  async addFlow(id: number, dto: CreateProjectFlowDto) {
    // 显式透传业务字段：dto.id 是项目ID（用于定位项目），不能写入 ProjectFlow 自增主键
    return this.prisma.projectFlow.create({
      data: {
        projectId: id,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        date: dto.date,
        remark: dto.remark,
        relatedMemberId: dto.relatedMemberId,
      }
    });
  }

  async getFlows(id: number) {
    return this.prisma.projectFlow.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' }
    });
  }

  async update(id: number, updateDto: any) {
    return this.prisma.project.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, user: any) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    // 仅组织负责人（或平台超管）可删除项目
    if (user.systemRole !== 'admin') {
      if (project.orgId !== user.orgId) {
        throw new ForbiddenException('Project does not belong to your current organization');
      }
      const currentMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: project.orgId, userId: user.sub }
      });
      if (!currentMember || currentMember.role !== 'owner') {
        throw new ForbiddenException('Only organization owner can delete project');
      }
    }

    // 事务内级联清理，防止表间数据脱钩
    return this.prisma.$transaction(async (tx: any) => {
      await tx.workRecord.deleteMany({ where: { projectId: id } });
      await tx.projectMember.deleteMany({ where: { projectId: id } });
      await tx.projectFlow.deleteMany({ where: { projectId: id } });
      await tx.workSummaryDaily.deleteMany({ where: { projectId: id } });
      return tx.project.delete({ where: { id } });
    });
  }

  // --- Admin Methods ---

  async findAllForAdmin(page: number, pageSize: number, keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { projectMembers: true, workRecords: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { list, total };
  }

  async setProjectStatus(id: number, status: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status },
    });
  }
}
