
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { CustomResponse } from '../common/responses/custom.response';

@Injectable()
export class WorkRecordsService {
  constructor(private prisma: PrismaService) {}

  private async updateDailySummary(projectId: number, memberId: number, date: string, deltaDuration: number, deltaRecord: number) {
    try {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return;
      await (this.prisma as any).workSummaryDaily.upsert({
        where: {
          orgId_projectId_memberId_date: {
            orgId: project.orgId,
            projectId,
            memberId,
            date,
          },
        },
        update: {
          totalDuration: { increment: deltaDuration },
          recordCount: { increment: deltaRecord },
        },
        create: {
          orgId: project.orgId,
          projectId,
          memberId,
          date,
          totalDuration: deltaDuration,
          recordCount: deltaRecord,
        },
      });
    } catch (_) {
      // Graceful fallback if summary table not yet migrated
    }
  }

  async create(createWorkRecordDto: CreateWorkRecordDto) {
    // Get member info for wage snapshot
    const member = await this.prisma.organizationMember.findUnique({
      where: { id: createWorkRecordDto.memberId },
    });

    if (!member) throw new Error('Member not found');

    // Convert duration to hours if wage type is day or month
    let durationInHours = createWorkRecordDto.duration;
    if (member.wageType === 'day' || member.wageType === 'month') {
        durationInHours = createWorkRecordDto.duration * 8;
    }

    const record = await this.prisma.workRecord.create({
      data: {
        projectId: createWorkRecordDto.projectId,
        memberId: createWorkRecordDto.memberId,
        date: createWorkRecordDto.date,
        duration: durationInHours,
        content: createWorkRecordDto.content,
        wageSnapshot: member.wageAmount,
        wageTypeSnapshot: member.wageType,
      },
    });
    await this.updateDailySummary(record.projectId, record.memberId, record.date, durationInHours, 1);
    return record;
  }

  async findAll(
    projectId: number, 
    date?: string, 
    month?: string, 
    page: number = 1, 
    pageSize: number = 20
  ) {
    const where: any = { projectId };
    
    if (date) {
        where.date = date;
    } else if (month) {
        // e.g. month="2023-10"
        where.date = {
            startsWith: month
        };
    }

    // If page & pageSize provided, implement pagination
    const skip = (page - 1) * pageSize;
    const take = +pageSize;

    const [list, total] = await Promise.all([
        this.prisma.workRecord.findMany({
            where,
            include: {
                member: {
                    include: {
                        user: true // Get avatar
                    }
                }
            },
            orderBy: { date: 'desc' },
            skip,
            take
        }),
        this.prisma.workRecord.count({ where })
    ]);

    // Map to frontend structure
    const data = list.map(record => ({
        id: record.id,
        projectId: record.projectId,
        userId: record.memberId, // Use memberId as userId reference
        userName: record.member.user?.name || record.member.user?.phone,
        userRole: record.member.role,
        avatar: record.member.user?.avatar || '',
        date: record.date,
        duration: record.duration,
        content: record.content,
        wageType: record.wageTypeSnapshot
    }));

    // Use CustomResponse to return data and property (pagination info)
    return CustomResponse.success(data, {}, { total, pageSize: +pageSize, currentPage: +page });
  }

  async getStats(projectId: number) {
    let stats: any[] = [];
    try {
      const daily = await (this.prisma as any).workSummaryDaily.groupBy({
        by: ['memberId'],
        where: { projectId },
        _sum: { totalDuration: true },
      });
      stats = daily.map(d => ({ memberId: d.memberId, _sum: { duration: d._sum.totalDuration || 0 } }));
    } catch (_) {
      // Fallback to raw workRecord aggregation
      stats = await (this.prisma as any).workRecord.groupBy({
        by: ['memberId'],
        where: { projectId },
        _sum: { duration: true },
      });
    }

    // Fetch member details
    const members = await this.prisma.organizationMember.findMany({
        where: {
            id: { in: stats.map(s => s.memberId) }
        },
        include: { user: true }
    });

    return stats.map(s => {
        const member = members.find(m => m.id === s.memberId);
        
        let total = s._sum.duration || 0;
        // Convert back to days for display if needed
        if (member?.wageType === 'day' || member?.wageType === 'month') {
            total = total / 8;
        }

        return {
            userId: s.memberId,
            userName: member?.user?.name || member?.user?.phone || 'Unknown',
            userAvatar: member?.user?.avatar || '',
            userRole: member?.role || 'member',
            totalDuration: total,
            wageType: member?.wageType || 'day'
        };
    });
  }

  async getSummaryByRange(params: { projectId?: number; orgId?: number; start?: string; end?: string; memberIds?: number[] }, user: any) {
    const { projectId, orgId, start, end, memberIds } = params
    const where: any = {}
    if (projectId) {
      where.projectId = projectId
    } else if (orgId) {
      where.orgId = orgId
    } else if (user?.currentOrgId) {
      where.orgId = user.currentOrgId
    }

    if (start && end) {
      where.date = { gte: start, lte: end }
    } else if (start) {
      where.date = { gte: start }
    } else if (end) {
      where.date = { lte: end }
    }
    if (memberIds && memberIds.length > 0) {
      where.memberId = { in: memberIds }
    }
    let stats: any[] = []
    try {
      const daily = await (this.prisma as any).workSummaryDaily.groupBy({
        by: ['memberId'],
        where,
        _sum: { totalDuration: true },
      })
      stats = daily.map((d: any) => ({ memberId: d.memberId, _sum: { duration: d._sum.totalDuration || 0 } }))
    } catch (_) {
      const fallbackWhere: any = {}
      if (start && end) {
        fallbackWhere.date = { gte: start, lte: end }
      } else if (start) {
        fallbackWhere.date = { gte: start }
      } else if (end) {
        fallbackWhere.date = { lte: end }
      }
      if (memberIds && memberIds.length > 0) {
        fallbackWhere.memberId = { in: memberIds }
      }
      
      if (projectId) {
        fallbackWhere.projectId = projectId
      } else {
        const targetOrgId = orgId || user?.currentOrgId
        if (targetOrgId) {
          fallbackWhere.project = { orgId: targetOrgId }
        }
      }

      stats = await (this.prisma as any).workRecord.groupBy({
        by: ['memberId'],
        where: fallbackWhere,
        _sum: { duration: true },
      })
    }
    const members = await this.prisma.organizationMember.findMany({
      where: {
        id: { in: stats.map((s: any) => s.memberId) }
      },
      include: { user: true }
    })
    return stats.map((s: any) => {
      const member = members.find(m => m.id === s.memberId)
      let total = s._sum.duration || 0
      if (member?.wageType === 'day' || member?.wageType === 'month') {
        total = total / 8
      }
      return {
        userId: s.memberId,
        userName: member?.user?.name || member?.user?.phone || 'Unknown',
        userAvatar: member?.user?.avatar || '',
        userRole: member?.role || 'member',
        totalDuration: total,
        wageType: member?.wageType || 'day'
      }
    })
  }

  async update(id: number, data: any) {
    const old = await this.prisma.workRecord.findUnique({ where: { id } });
    if (!old) throw new Error('Record not found');
    const updated = await this.prisma.workRecord.update({
      where: { id },
      data: {
        duration: data.duration,
        content: data.content,
        date: data.date
      }
    });
    if (old.date === updated.date) {
      const delta = (updated.duration || 0) - (old.duration || 0);
      if (delta !== 0) {
        await this.updateDailySummary(updated.projectId, updated.memberId, updated.date, delta, 0);
      }
    } else {
      await this.updateDailySummary(old.projectId, old.memberId, old.date, -(old.duration || 0), -1);
      await this.updateDailySummary(updated.projectId, updated.memberId, updated.date, (updated.duration || 0), 1);
    }
    return updated;
  }

  async remove(id: number) {
    const old = await this.prisma.workRecord.findUnique({ where: { id } });
    if (!old) throw new Error('Record not found');
    const deleted = await this.prisma.workRecord.delete({
      where: { id }
    });
    await this.updateDailySummary(old.projectId, old.memberId, old.date, -(old.duration || 0), -1);
    return deleted;
  }

  async batchCreate(data: { projectId: number, date: string, records: { memberId: number, duration: number }[] }) {
      const { projectId, date, records } = data;
      // Get all members to verify and get snapshots
      const members = await this.prisma.organizationMember.findMany({
          where: {
              id: { in: records.map(r => r.memberId) }
          }
      });

      const operations = records.map(record => {
          const member = members.find(m => m.id === record.memberId);
          if (!member) return null; // Skip invalid members
          
          let durationInHours = record.duration;
          if (member.wageType === 'day' || member.wageType === 'month') {
              durationInHours = record.duration * 8;
          }

          return this.prisma.workRecord.create({
              data: {
                  projectId,
                  date,
                  memberId: record.memberId,
                  duration: durationInHours,
                  content: '', // Default empty for batch
                  wageSnapshot: member.wageAmount,
                  wageTypeSnapshot: member.wageType
              }
          });
      }).filter(op => op !== null);

      // Filter out nulls safely (TS might complain about type)
      const validOps = operations as any[]; 
      const created = await this.prisma.$transaction(validOps);
      // Summary maintenance (best-effort)
      const createdSummaries = created.map(r => this.updateDailySummary(projectId, r.memberId, date, r.duration || 0, 1));
      await Promise.all(createdSummaries).catch(() => {});
      return created;
  }
}
