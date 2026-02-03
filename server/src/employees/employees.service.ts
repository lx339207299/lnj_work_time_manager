
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phone: createEmployeeDto.phone },
    });

    if (!user) {
      throw new Error('该手机号用户尚未注册，请先邀请其注册');
    }

    return this.prisma.organizationMember.create({
      data: {
        organization: { connect: { id: createEmployeeDto.orgId } },
        user: { connect: { id: user.id } },
        role: createEmployeeDto.role || 'member',
        wageType: createEmployeeDto.wageType || 'day',
        wageAmount: createEmployeeDto.wageAmount || 0,
        status: 'active',
      }, // 暂时保留 as any 直到 IDE 类型同步完成，这样能确保编译通过且逻辑正确
    });
  }

  findAll(orgId: number) {
    return this.prisma.organizationMember.findMany({
      where: { orgId },
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
    });
  }

  update(id: number, data: any) {
    return this.prisma.organizationMember.update({
        where: { id },
        data
    });
  }

  remove(id: number) {
    return this.prisma.organizationMember.delete({
      where: { id },
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
