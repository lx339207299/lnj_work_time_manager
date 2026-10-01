
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { CustomResponse } from '../common/responses/custom.response';

@Injectable()
export class WorkRecordsService {
  constructor(private prisma: PrismaService) {}

  // P2002(唯一索引冲突)→ 友好业务错误;AllExceptionsFilter 会把 message 透传给前端
  private toFriendlyUniqueError(e: unknown, msg: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new Error(msg);
    }
    throw e as Error;
  }

  private calculateAmount(durationInHours: number, wageType: string, wageAmount: number): number {
    // wageAmount 单位：分（Int）。返回值单位：分（Int）。
    // 中间过程保持浮点，仅在最终结果四舍五入到整分，避免累计误差。
    let exact: number;
    if (wageType === 'hour') {
      exact = durationInHours * wageAmount;
    } else if (wageType === 'day') {
      exact = (durationInHours / 8) * wageAmount;
    } else if (wageType === 'month') {
      // Assuming 21.75 working days per month for calculation
      exact = (durationInHours / 8) * (wageAmount / 21.75);
    } else {
      return 0;
    }
    return Math.round(exact);
  }

  // 取「工作日期当天生效」的工资（effectiveFrom 含当天；同日多次调薪取最后一条）。
  // 无早于该日期的历史行时兜底回成员现值（如补记日期早于建档日）。
  private async getWageAt(memberId: number, date: string) {
    const history = await this.prisma.organizationMemberWageHistory.findFirst({
      where: { memberId, effectiveFrom: { lte: date } },
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    });
    if (history) return { wageType: history.wageType, wageAmount: history.wageAmount };
    const member = await this.prisma.organizationMember.findUnique({ where: { id: memberId } });
    return { wageType: member?.wageType || 'day', wageAmount: member?.wageAmount || 0 };
  }

  // 统计更新必须与明细写入处于同一事务（tx 由调用方传入），
  // 任一失败抛错并整体回滚，避免明细与统计脱钩。
  private async updateDailySummary(projectId: number, memberId: number, date: string, deltaDuration: number, deltaRecord: number, deltaAmount: number, tx?: any) {
    const db = (tx || this.prisma) as any;
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return;
    await db.workSummaryDaily.upsert({
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
        totalAmount: { increment: deltaAmount },
        recordCount: { increment: deltaRecord },
      },
      create: {
        orgId: project.orgId,
        projectId,
        memberId,
        date,
        totalDuration: deltaDuration,
        totalAmount: deltaAmount,
        recordCount: deltaRecord,
      },
    });
  }

  private async checkPermission(user: any, projectId: number) {
    if (user.systemRole === 'admin') return;
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    
    if (project.orgId !== user.orgId) {
      throw new ForbiddenException('Project does not belong to your current organization');
    }
    
    const currentMember = await this.prisma.organizationMember.findFirst({
      where: { orgId: user.orgId, userId: user.sub }
    });
    
    if (!currentMember || !['owner', 'admin', 'leader'].includes(currentMember.role)) {
      throw new ForbiddenException('Only owner, admin, or leader can manage work records');
    }
  }

  async create(createWorkRecordDto: CreateWorkRecordDto, user?: any) {
    if (user) {
        await this.checkPermission(user, createWorkRecordDto.projectId);
    }
    // Get member info for wage snapshot
    const member = await this.prisma.organizationMember.findUnique({
      where: { id: createWorkRecordDto.memberId },
    });

    if (!member) throw new Error('Member not found');

    // 按工作日期取「当时生效」的工资：调薪后补记历史日期仍按旧价计算
    const wage = await this.getWageAt(createWorkRecordDto.memberId, createWorkRecordDto.date);

    // Convert duration to hours if wage type is day or month
    let durationInHours = createWorkRecordDto.duration;
    if (wage.wageType === 'day' || wage.wageType === 'month') {
        durationInHours = createWorkRecordDto.duration * 8;
    }

    const amount = this.calculateAmount(durationInHours, wage.wageType, wage.wageAmount);

    // 明细 + 统计同一事务：统计更新失败则整体回滚并报错。
    // 同一 (projectId, memberId, date) 已有记录时做覆盖更新（按天唯一），
    // 工资快照/金额按当日生效价重算，统计记差值且条数不变。
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workRecord.findUnique({
        where: {
          projectId_memberId_date: {
            projectId: createWorkRecordDto.projectId,
            memberId: createWorkRecordDto.memberId,
            date: createWorkRecordDto.date,
          },
        },
      });

      if (existing) {
        const rec = await tx.workRecord.update({
          where: { id: existing.id },
          data: {
            duration: durationInHours,
            content: createWorkRecordDto.content ?? existing.content,
            wageSnapshot: wage.wageAmount,
            wageTypeSnapshot: wage.wageType,
            amount,
          },
        });
        await this.updateDailySummary(
          rec.projectId,
          rec.memberId,
          rec.date,
          durationInHours - (existing.duration || 0),
          0, // 覆盖不改变条数
          amount - (existing.amount || 0),
          tx,
        );
        return { rec, old: existing, isOverwrite: true };
      }

      const rec = await tx.workRecord.create({
        data: {
          projectId: createWorkRecordDto.projectId,
          memberId: createWorkRecordDto.memberId,
          date: createWorkRecordDto.date,
          duration: durationInHours,
          content: createWorkRecordDto.content,
          wageSnapshot: wage.wageAmount,
          wageTypeSnapshot: wage.wageType,
          amount,
        },
      });
      await this.updateDailySummary(rec.projectId, rec.memberId, rec.date, durationInHours, 1, amount, tx);
      return { rec, old: null as any, isOverwrite: false };
    }).catch((e) => this.toFriendlyUniqueError(e, '该员工当日已有工时记录，写入冲突，请重试'));

    const record = result.rec;

    // Record Log
    if (user) {
        await this.prisma.workRecordLog.create({
            data: {
                orgId: member.orgId,
                projectId: record.projectId,
                workRecordId: record.id,
                operatorId: user.sub || user.userId, // Assuming user object has sub or userId
                targetMemberId: record.memberId,
                date: record.date,
                action: result.isOverwrite ? 'UPDATE' : 'CREATE',
                oldData: result.isOverwrite ? JSON.stringify(result.old) : null,
                newData: JSON.stringify(record)
            }
        });
    }

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
        wageType: record.wageTypeSnapshot,
        createdAt: record.createdAt
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
        _sum: { totalDuration: true, totalAmount: true },
      });
      stats = daily.map(d => ({ memberId: d.memberId, _sum: { duration: d._sum.totalDuration || 0, amount: d._sum.totalAmount || 0 } }));
    } catch (_) {
      // Fallback to raw workRecord aggregation
      stats = await (this.prisma as any).workRecord.groupBy({
        by: ['memberId'],
        where: { projectId },
        _sum: { duration: true, amount: true },
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
            totalAmount: s._sum.amount || 0,
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
        _sum: { totalDuration: true, totalAmount: true },
      })
      stats = daily.map((d: any) => ({ memberId: d.memberId, _sum: { duration: d._sum.totalDuration || 0, amount: d._sum.totalAmount || 0 } }))
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
        _sum: { duration: true, amount: true },
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
        totalAmount: s._sum.amount || 0,
        wageType: member?.wageType || 'day'
      }
    })
  }

  async update(id: number, data: any, user?: any) {
    const old = await this.prisma.workRecord.findUnique({ where: { id } });
    if (!old) throw new Error('Record not found');

    if (user) {
        await this.checkPermission(user, old.projectId);
    }

    // Get member for context info (orgId)
    const member = await this.prisma.organizationMember.findUnique({ where: { id: old.memberId } });

    // Calculate old amount (if not present, calculate on fly)
    const oldAmount = (old as any).amount !== undefined 
      ? (old as any).amount 
      : this.calculateAmount(old.duration, old.wageTypeSnapshot, old.wageSnapshot);

    // Calculate new amount
    // If data.duration is provided, use it, else use old.duration
    const newDuration = data.duration !== undefined ? data.duration : old.duration;
    // Note: wage snapshot and type are immutable on update unless we want to support re-calculating based on NEW wage (which is usually not the case for historical records)
    // However, if the user edits the record, should we re-fetch current wage?
    // Usually NO. We stick to the snapshot unless explicitly asked.
    // So we use old.wageTypeSnapshot and old.wageSnapshot.
    
    // BUT, if duration is updated, amount changes.
    // Also, if duration changes, we might need to be careful if input data.duration is in 'days' but stored as 'hours'.
    // The `data` here comes from controller. Controller usually passes what frontend sends.
    // Frontend sends 'duration'. If wageType is day/month, frontend sends days?
    // In `create`, we check member.wageType.
    // In `update`, we don't fetch member by default.
    // We should probably fetch member to check wageType OR trust the snapshot.
    // Using snapshot is safer for historical consistency.
    
    // Wait, `create` logic:
    // if (member.wageType === 'day' || member.wageType === 'month') durationInHours = input * 8;
    
    // In `update`, `data.duration` might be raw input.
    // We need to know if we need to convert it.
    // If we use `old.wageTypeSnapshot`, we can decide.
    
    let durationInHours = newDuration;
    // Assuming the frontend sends 'days' for day/month types, we need to convert.
    if (old.wageTypeSnapshot === 'day' || old.wageTypeSnapshot === 'month') {
       // Check if data.duration is being updated.
       if (data.duration !== undefined) {
          durationInHours = data.duration * 8;
       }
    }

    const newAmount = this.calculateAmount(durationInHours, old.wageTypeSnapshot, old.wageSnapshot);

    // 明细 + 统计同一事务：跨日期时的「旧日期扣减 + 新日期累加」也必须原子完成
    const updated = await this.prisma.$transaction(async (tx) => {
      // 按天唯一：改日期时目标日期不能已有该员工的其他记录
      if (data.date && data.date !== old.date) {
        const conflict = await tx.workRecord.findFirst({
          where: { projectId: old.projectId, memberId: old.memberId, date: data.date, id: { not: id } },
        });
        if (conflict) {
          throw new Error(`该员工在 ${data.date} 已有工时记录，请在那条记录上直接修改`);
        }
      }

      const rec = await tx.workRecord.update({
        where: { id },
        data: {
          duration: durationInHours,
          content: data.content,
          date: data.date,
          amount: newAmount
        }
      });

      if (old.date === rec.date) {
        const deltaDuration = (rec.duration || 0) - (old.duration || 0);
        const deltaAmount = newAmount - oldAmount;
        if (deltaDuration !== 0 || deltaAmount !== 0) {
          await this.updateDailySummary(rec.projectId, rec.memberId, rec.date, deltaDuration, 0, deltaAmount, tx);
        }
      } else {
        await this.updateDailySummary(old.projectId, old.memberId, old.date, -(old.duration || 0), -1, -oldAmount, tx);
        await this.updateDailySummary(rec.projectId, rec.memberId, rec.date, (rec.duration || 0), 1, newAmount, tx);
      }

      return rec;
    }).catch((e) => this.toFriendlyUniqueError(e, '该员工在目标日期已有工时记录，不能重复添加'));

    // Record Log
    if (user && member) {
        await this.prisma.workRecordLog.create({
            data: {
                orgId: member.orgId,
                projectId: updated.projectId,
                workRecordId: updated.id,
                operatorId: user.sub || user.userId,
                targetMemberId: updated.memberId,
                date: updated.date,
                action: 'UPDATE',
                oldData: JSON.stringify(old),
                newData: JSON.stringify(updated)
            }
        });
    }

    return updated;
  }

  async remove(id: number, user?: any) {
    const old = await this.prisma.workRecord.findUnique({ where: { id } });
    if (!old) throw new Error('Record not found');

    if (user) {
        await this.checkPermission(user, old.projectId);
    }

    // Get member for context info (orgId)
    const member = await this.prisma.organizationMember.findUnique({ where: { id: old.memberId } });
    
    const oldAmount = (old as any).amount !== undefined 
      ? (old as any).amount 
      : this.calculateAmount(old.duration, old.wageTypeSnapshot, old.wageSnapshot);

    // 明细 + 统计同一事务：删除与统计扣减原子完成
    const deleted = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.workRecord.delete({
        where: { id }
      });
      await this.updateDailySummary(old.projectId, old.memberId, old.date, -(old.duration || 0), -1, -oldAmount, tx);
      return rec;
    });

    // Record Log
    if (user && member) {
        await this.prisma.workRecordLog.create({
            data: {
                orgId: member.orgId,
                projectId: old.projectId,
                workRecordId: old.id,
                operatorId: user.sub || user.userId,
                targetMemberId: old.memberId,
                date: old.date,
                action: 'DELETE',
                oldData: JSON.stringify(old),
                newData: null
            }
        });
    }

    return deleted;
  }

  async batchCreate(data: { projectId: number | string, date: string, records: { memberId: number, duration: number }[] }, user?: any) {
      if (user) {
          await this.checkPermission(user, Number(data.projectId));
      }
      const { projectId, date, records: rawRecords } = data;
      // 同批次同 memberId 去重(last-wins)：唯一约束下重复输入会整批失败
      const records = [...new Map(rawRecords.map(r => [r.memberId, r])).values()];
      // Get all members to verify and get snapshots
      const members = await this.prisma.organizationMember.findMany({
          where: {
              id: { in: records.map(r => r.memberId) }
          }
      });

      const numProjectId = Number(projectId);

      // 取批次日期当天生效的工资历史（批次内日期相同，一次查询覆盖全部成员；
      // orderBy 倒序后每个成员首次出现的行即最新一条）
      const latestHistories = await this.prisma.organizationMemberWageHistory.findMany({
          where: {
              memberId: { in: records.map(r => r.memberId) },
              effectiveFrom: { lte: date },
          },
          orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
      });
      const historyByMember = new Map<number, { wageType: string, wageAmount: number }>();
      for (const h of latestHistories) {
          if (!historyByMember.has(h.memberId)) {
              historyByMember.set(h.memberId, { wageType: h.wageType, wageAmount: h.wageAmount });
          }
      }

      const recordDataList = records.map(record => {
          const member = members.find(m => m.id === record.memberId);
          if (!member) return null; // Skip invalid members

          // 历史价优先，无则兜底成员现值
          const wage = historyByMember.get(record.memberId)
              || { wageType: member.wageType, wageAmount: member.wageAmount };

          let durationInHours = record.duration;
          if (wage.wageType === 'day' || wage.wageType === 'month') {
              durationInHours = record.duration * 8;
          }

          const amount = this.calculateAmount(durationInHours, wage.wageType, wage.wageAmount);

          return {
              projectId: numProjectId,
              date,
              memberId: record.memberId,
              duration: durationInHours,
              content: '', // Default empty for batch
              wageSnapshot: wage.wageAmount,
              wageTypeSnapshot: wage.wageType,
              amount
          };
      }).filter(op => op !== null);

      // Filter out nulls safely (TS might complain about type)
      const validDataList = recordDataList as any[];

      // 按天唯一：查出该日已有记录，已有则覆盖更新
      const existingRecords = await this.prisma.workRecord.findMany({
          where: { projectId: numProjectId, date, memberId: { in: validDataList.map(d => d.memberId) } },
      });
      const existingByMember = new Map(existingRecords.map(r => [r.memberId, r]));

      // 明细 + 统计同一事务：任一条失败整体回滚并报错（替换原 best-effort 统计更新）
      const results: { rec: any; old: any; isOverwrite: boolean }[] = [];
      await this.prisma.$transaction(async (tx) => {
          for (const data of validDataList) {
              const existing = existingByMember.get(data.memberId);
              if (existing) {
                  // 覆盖更新：batch 不带 content（不传即保留原备注）；统计记差值且条数不变
                  const rec = await tx.workRecord.update({
                      where: { id: existing.id },
                      data: {
                          duration: data.duration,
                          wageSnapshot: data.wageSnapshot,
                          wageTypeSnapshot: data.wageTypeSnapshot,
                          amount: data.amount,
                      },
                  });
                  await this.updateDailySummary(
                      rec.projectId, rec.memberId, date,
                      (rec.duration || 0) - (existing.duration || 0),
                      0,
                      ((rec as any).amount || 0) - (existing.amount || 0),
                      tx,
                  );
                  results.push({ rec, old: existing, isOverwrite: true });
              } else {
                  const rec = await tx.workRecord.create({ data });
                  await this.updateDailySummary(rec.projectId, rec.memberId, date, rec.duration || 0, 1, (rec as any).amount || 0, tx);
                  results.push({ rec, old: null, isOverwrite: false });
              }
          }
      }).catch((e) => this.toFriendlyUniqueError(e, '部分记录写入冲突，请重试'));

      // Record logs
      if (user) {
        const logOps = results.map(({ rec, old, isOverwrite }) => {
            const member = members.find(m => m.id === rec.memberId);
            if (!member) return null;
            return this.prisma.workRecordLog.create({
                data: {
                    orgId: member.orgId,
                    projectId: rec.projectId,
                    workRecordId: rec.id,
                    operatorId: user.sub || user.userId,
                    targetMemberId: rec.memberId,
                    date: rec.date,
                    action: isOverwrite ? 'UPDATE' : 'CREATE',
                    oldData: isOverwrite ? JSON.stringify(old) : null,
                    newData: JSON.stringify(rec)
                }
            });
        }).filter(Boolean) as any[];
        if (logOps.length > 0) {
            await this.prisma.$transaction(logOps).catch(() => {});
        }
      }

      return CustomResponse.success({
          records: results.map(r => r.rec),
          createdCount: results.filter(r => !r.isOverwrite).length,
          updatedCount: results.filter(r => r.isOverwrite).length,
      });
  }
}
