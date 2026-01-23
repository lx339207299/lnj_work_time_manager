
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
      data: createProjectDto,
    });
  }

  async findAll(orgId: string) {
    const projects = await this.prisma.project.findMany({
      where: { orgId },
      include: {
        projectMembers: true,
        workRecords: true,
      },
    });

    // Map to match frontend Project interface with stats
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      role: 'owner', // TODO: Determine role based on requesting user
      memberCount: p.projectMembers.length,
      totalHours: p.workRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      totalDays: Math.ceil(p.workRecords.reduce((sum: number, r: any) => sum + r.duration, 0) / 8), // Rough estimate
    }));
  }

  async findOne(id: string) {
    const p: any = await this.prisma.project.findUnique({
      where: { id },
      include: {
        projectMembers: true,
        workRecords: true,
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      role: 'owner', // TODO
      memberCount: p.projectMembers.length,
      totalHours: p.workRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      totalDays: Math.ceil(p.workRecords.reduce((sum: number, r: any) => sum + r.duration, 0) / 8),
    };
  }

  async addMembers(id: string, dto: AddProjectMembersDto) {
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

  async getMembers(id: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        member: {
            include: { user: true } // Get avatar from user
        }
      }
    });

    return memberships.map(m => ({
        id: m.member.id,
        name: m.member.name,
        role: m.member.role, // Org role
        wageType: m.member.wageType,
        avatar: m.member.user?.avatar || ''
    }));
  }

  async addFlow(id: string, dto: CreateProjectFlowDto) {
    return this.prisma.projectFlow.create({
      data: {
        projectId: id,
        ...dto
      }
    });
  }

  async getFlows(id: string) {
    return this.prisma.projectFlow.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' }
    });
  }
}
