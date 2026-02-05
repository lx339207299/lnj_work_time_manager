
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

    // Check if already member
    const existingMember = await this.prisma.organizationMember.findFirst({
        where: {
            orgId: createEmployeeDto.orgId,
            userId: user.id
        }
    });

    if (existingMember) {
        if (existingMember.isDeleted) {
            return this.prisma.organizationMember.update({
                where: { id: existingMember.id },
                data: {
                    isDeleted: false,
                    role: createEmployeeDto.role || 'member',
                    wageType: createEmployeeDto.wageType || 'day',
                    wageAmount: createEmployeeDto.wageAmount || 0,
                    status: 'active'
                }
            });
        }
        throw new Error('该用户已经是本组织成员');
    }

    return this.prisma.organizationMember.create({
      data: {
        organization: { connect: { id: createEmployeeDto.orgId } },
        user: { connect: { id: user.id } },
        role: createEmployeeDto.role || 'member',
        wageType: createEmployeeDto.wageType || 'day',
        wageAmount: createEmployeeDto.wageAmount || 0,
        status: 'active',
      }, 
    });
  }

  findAll(orgId: number, onlyActive: boolean = true) {
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

  update(id: number, data: any) {
    return this.prisma.organizationMember.update({
        where: { id },
        data
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
