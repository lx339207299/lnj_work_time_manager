
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectFlowDto } from './dto/create-project-flow.dto';

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
        }
      },
    });
  }

  async findAll(orgId: number, user: any) {
    const projects = await this.prisma.project.findMany({
      where: { orgId },
      include: {
        projectMembers: true,
        workRecords: true,
      },
    });

    // Get current user's organization member record to determine their role
    const userMember = await this.prisma.organizationMember.findFirst({
      where: {
        orgId: orgId,
        userId: user.sub
      }
    });

    // Map to match frontend Project interface with stats
    return projects.map((p: any) => {
      // Check if current user is project owner (created the project)
      const isOwner = p.projectMembers.some((pm: any) => 
        pm.userId === user.sub && pm.role === 'owner'
      );
      
      const hoursRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'hour');
      const daysRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'day' || r.wageTypeSnapshot === 'month');

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        role: isOwner ? 'owner' : (userMember?.role || 'member'), // Determine role based on org membership
        memberCount: p.projectMembers.length,
        totalHours: hoursRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
        totalDaysHours: daysRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      };
    });
  }

  async findOne(id: number, user: any) {
    const p: any = await this.prisma.project.findUnique({
      where: { id },
      include: {
        projectMembers: true,
        workRecords: true,
      },
    });

    if (!p) return null;

    // Get current user's organization member record
    const userMember = await this.prisma.organizationMember.findFirst({
      where: {
        orgId: p.orgId,
        userId: user.sub
      }
    });

    // Check if current user is project owner
    const isOwner = p.projectMembers.some((pm: any) => 
      pm.userId === user.sub && pm.role === 'owner'
    );

    const hoursRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'hour');
    const daysRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'day' || r.wageTypeSnapshot === 'month');

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      ownerName: p.projectMembers.find((pm: any) => pm.role === 'owner')?.member?.user?.name || '',
      role: isOwner ? 'owner' : (userMember?.role || 'member'), // Determine role based on org membership
      memberCount: p.projectMembers.length,
      totalHours: hoursRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      totalDaysHours: daysRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
    };
  }

  async addMembers(id: number, dto: AddProjectMembersDto) {
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
        avatar: m.member.user?.avatar || ''
    }));
  }

  async addFlow(id: number, dto: CreateProjectFlowDto) {
    return this.prisma.projectFlow.create({
      data: {
        projectId: id,
        ...dto
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

  async remove(id: number) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
