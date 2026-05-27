import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('admin/work-records')
@Controller('admin/work-records')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminWorkRecordsController {
  constructor(
    private readonly workRecordsService: WorkRecordsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin: 全局工时记录查询' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('orgId') orgId?: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;

    const where: any = {};

    if (projectId) {
      where.projectId = Number(projectId);
    }

    if (orgId || keyword) {
      const projectWhere: any = {};
      if (orgId) {
        projectWhere.orgId = Number(orgId);
      }
      if (keyword) {
        projectWhere.OR = [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ];
      }
      const projects = await this.prisma.project.findMany({
        where: projectWhere,
        select: { id: true },
      });
      where.projectId = { in: [...new Set([...(where.projectId ? [where.projectId] : []), ...projects.map(p => p.id)])] };
    }

    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    const [list, total] = await Promise.all([
      this.prisma.workRecord.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, organization: { select: { id: true, name: true } } } },
          member: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      }),
      this.prisma.workRecord.count({ where }),
    ]);

    const data = list.map(r => ({
      id: r.id,
      date: r.date,
      duration: r.duration,
      content: r.content,
      amount: r.amount,
      wageType: r.wageTypeSnapshot,
      createdAt: r.createdAt,
      projectId: r.projectId,
      projectName: r.project.name,
      orgId: r.project.organization.id,
      orgName: r.project.organization.name,
      userName: r.member.user?.name || r.member.user?.phone || '-',
      userId: r.member.user?.id,
    }));

    return CustomResponse.success(data, undefined, { total, pageSize: ps, currentPage: p });
  }
}
