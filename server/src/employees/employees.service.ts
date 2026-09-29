
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { phone: createEmployeeDto.phone },
    });

    if (!user) {
      // Create user if not exists
      user = await this.prisma.user.create({
        data: {
          phone: createEmployeeDto.phone,
          name: createEmployeeDto.name || createEmployeeDto.phone,
          birthday: createEmployeeDto.birthday,
          currentOrgId: createEmployeeDto.orgId, // Set current org to the new org
        },
      });
    } else {
        // If user exists but has no current org, set it
        if (!user.currentOrgId) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { currentOrgId: createEmployeeDto.orgId }
            });
        }
    }

    // 建档/调薪立即生效：历史行生效日取北京时间「今天」（容器为 UTC，直接 toISOString 会差 8 小时）
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

    // Check if already member
    const existingMember = await this.prisma.organizationMember.findFirst({
        where: {
            orgId: createEmployeeDto.orgId,
            userId: user.id
        }
    });

    if (existingMember) {
        if (existingMember.isDeleted) {
            // 复活会覆盖工资：member 更新与历史行同一事务，防止脱钩
            return this.prisma.$transaction(async (tx) => {
                const member = await tx.organizationMember.update({
                    where: { id: existingMember.id },
                    data: {
                        isDeleted: false,
                        role: createEmployeeDto.role || 'member',
                        wageType: createEmployeeDto.wageType || 'day',
                        wageAmount: createEmployeeDto.wageAmount, // Must be provided as it is now required
                        status: 'active'
                    }
                });
                await tx.organizationMemberWageHistory.create({
                    data: {
                        memberId: member.id,
                        wageType: member.wageType,
                        wageAmount: member.wageAmount,
                        effectiveFrom: today,
                    },
                });
                return member;
            });
        }
        throw new Error('该用户已经是本组织成员');
    }

    // 新建档：member 与初始工资历史同一事务
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.create({
        data: {
          organization: { connect: { id: createEmployeeDto.orgId } },
          user: { connect: { id: user.id } },
          role: createEmployeeDto.role || 'member',
          wageType: createEmployeeDto.wageType || 'day',
          wageAmount: createEmployeeDto.wageAmount, // Required field
          status: 'active',
        },
      });
      await tx.organizationMemberWageHistory.create({
        data: {
          memberId: member.id,
          wageType: member.wageType,
          wageAmount: member.wageAmount,
          // 建档工资为真实必填值：用哨兵日期表示「自最早起生效」，
          // 保证之后调薪、补记任何历史日期都能取到建档时的工资。
          // 邀请加入/owner 的初始 0 是占位值，不走此逻辑（建档日生效，之前兜底现值）。
          effectiveFrom: '1970-01-01',
        },
      });
      return member;
    });
  }

  async batchCreate(orgId: number, employees: { name: string; phone: string; wageAmount: number; wageType?: string }[]) {
    const results = [];
    for (const emp of employees) {
      try {
        await this.create({
          orgId,
          phone: emp.phone,
          name: emp.name,
          role: 'member',
          wageType: emp.wageType || 'day',
          wageAmount: emp.wageAmount,
        });
        results.push({ phone: emp.phone, status: 'success' });
      } catch (error: any) {
        results.push({ phone: emp.phone, status: 'failed', reason: error.message });
      }
    }
    return results;
  }

  findAll(orgId: number | null, onlyActive: boolean = true) {
    if (!orgId) return [];
    const where: any = { orgId };
    if (onlyActive) {
        where.isDeleted = false;
    }
    return this.prisma.organizationMember.findMany({
      where,
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            birthday: true
          }
        } 
      }
    });
  }

  findOne(id: number) {
    return this.prisma.organizationMember.findUnique({
      where: { id },
      include: {
        user: {
            select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
                birthday: true
            }
        }
      }
    });
  }

  async update(id: number, data: any) {
    const old = await this.prisma.organizationMember.findUnique({ where: { id } });
    if (!old) throw new Error('Member not found');

    // 工资实际变化才写历史行（调薪立即生效：effectiveFrom=今天）
    const wageChanged = (data.wageType !== undefined && data.wageType !== old.wageType)
      || (data.wageAmount !== undefined && data.wageAmount !== old.wageAmount);
    if (!wageChanged) {
      return this.prisma.organizationMember.update({
          where: { id },
          data
      });
    }

    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.update({
          where: { id },
          data
      });
      await tx.organizationMemberWageHistory.create({
        data: {
          memberId: member.id,
          wageType: member.wageType,
          wageAmount: member.wageAmount,
          effectiveFrom: today,
        },
      });
      return member;
    });
  }

  remove(id: number) {
    return this.prisma.organizationMember.update({
        where: { id },
        data: { isDeleted: true }
    });
  }

  async transferOwnership(targetMemberId: number, currentUserId: number) {
    const targetMember = await this.prisma.organizationMember.findUnique({
        where: { id: targetMemberId }
    });
    if (!targetMember) throw new Error('Member not found');

    const org = await this.prisma.organization.findUnique({
        where: { id: targetMember.orgId }
    });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId !== currentUserId) throw new Error('Only owner can transfer ownership');

    // Find current owner member record
    const currentOwnerMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: org.id, userId: currentUserId }
    });

    return this.prisma.$transaction(async (tx: any) => {
        // 1. Update Org owner
        await tx.organization.update({
            where: { id: org.id },
            data: { ownerId: targetMember.userId || 0 } // Ideally target must have userId
        });

        // 2. Downgrade current owner to member
        if (currentOwnerMember) {
            await tx.organizationMember.update({
                where: { id: currentOwnerMember.id },
                data: { role: 'member' }
            });
        }

        // 3. Upgrade target to owner
        await tx.organizationMember.update({
            where: { id: targetMemberId },
            data: { role: 'owner' }
        });
    });
  }
}
