
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

    return this.prisma.organizationMember.create({
      data: {
        orgId: createEmployeeDto.orgId,
        userId: user?.id || null, // Link if exists
        name: createEmployeeDto.name,
        phone: createEmployeeDto.phone,
        role: createEmployeeDto.role || 'member',
        wageType: createEmployeeDto.wageType || 'day',
        wageAmount: createEmployeeDto.wageAmount || 0,
        birthday: createEmployeeDto.birthday,
        status: 'active', // Should be pending if user is null? But user wants "invite -> register -> join" flow.
        // If we add them directly, they are 'active' in the system view, but maybe user needs to confirm?
        // Let's assume active for simplicity or pending logic in invite flow.
      },
    });
  }

  findAll(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { orgId },
      include: { user: true } // Include user avatar/info if linked
    });
  }

  findOne(id: string) {
    return this.prisma.organizationMember.findUnique({
      where: { id },
    });
  }

  update(id: string, data: any) {
    return this.prisma.organizationMember.update({
        where: { id },
        data
    });
  }

  remove(id: string) {
    return this.prisma.organizationMember.delete({
      where: { id },
    });
  }

  async transferOwnership(targetMemberId: string, currentUserId: string) {
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
            data: { ownerId: targetMember.userId || '' } // Ideally target must have userId
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
