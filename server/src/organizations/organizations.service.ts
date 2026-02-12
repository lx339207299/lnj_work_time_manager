
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createOrganizationDto: CreateOrganizationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Transaction: Create Org + Add Creator as Owner + Set as current org
    return this.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: createOrganizationDto.name,
          description: createOrganizationDto.description,
          ownerId: userId,
        },
      });

      await tx.organizationMember.create({
        data: {
          orgId: org.id,
          userId: userId,
          role: 'owner',
          wageType: 'month', // Owner salary default: month
          wageAmount: 0,     // Owner salary default: 0
          status: 'active',
        },
      });

      // 自动切换到新创建的组织
      await tx.user.update({
        where: { id: userId },
        data: { currentOrgId: org.id }
      });

      return {
        ...org,
        role: 'owner'
      };
    });
  }

  async switchToOrg(userId: number, orgId: number) {
    // 验证用户是否有权限访问该组织
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        orgId,
        status: 'active',
        organization: { isDeleted: false }
      }
    });

    if (!membership) {
      throw new Error('您没有权限访问该组织');
    }

    // 更新用户的当前组织
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentOrgId: orgId }
    });

    // 返回组织信息
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId }
    });

    return {
      success: true,
      currentOrgId: orgId,
      org: {
        id: org?.id,
        name: org?.name,
        description: org?.description
      }
    };
  }

  async findAll(userId: number) {
    // Find orgs where user is a member and org is not deleted
    const memberships = await this.prisma.organizationMember.findMany({
      where: { 
        userId,
        organization: { isDeleted: false }
      },
      include: { organization: true },
    });
    return memberships.map((m) => ({
      ...m.organization,
      role: m.role, // Include role in the list
    }));
  }

  async findOne(id: number) {
    return this.prisma.organization.findFirst({
      where: { 
        id,
        isDeleted: false
      },
      include: {
          members: true,
          projects: true
      }
    });
  }

  async update(id: number, userId: number, updateDto: any) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org || org.isDeleted) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can update organization');

    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, userId: number) {
    const org = await this.prisma.organization.findUnique({ 
      where: { id },
      include: { members: true }
    });
    if (!org || org.isDeleted) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can delete organization');

    // Transactional logical delete
    return this.prisma.$transaction(async (tx: any) => {
        // 1. 处理所有成员：将所有当前选中该组织的用户（包括当前用户）的 currentOrgId 置为 null
        // 或者切换到另一个组织。
        
        // 先获取受影响的用户ID列表
        const affectedUserIds = await tx.organizationMember.findMany({
            where: { orgId: id },
            select: { userId: true }
        }).then((members: any[]) => members.map(m => m.userId));

        // 对每个用户，如果其 currentOrgId 是当前要删除的组织，则尝试切换
        for (const affectedUserId of affectedUserIds) {
            const user = await tx.user.findUnique({
                where: { id: affectedUserId },
                select: { currentOrgId: true }
            });

            if (user?.currentOrgId === id) {
                // 查找该用户加入的第一个其他未删除组织
                const otherMembership = await tx.organizationMember.findFirst({
                    where: { 
                        userId: affectedUserId,
                        orgId: { not: id },
                        status: 'active',
                        organization: { isDeleted: false }
                    },
                    orderBy: { createdAt: 'asc' }
                });

                await tx.user.update({
                    where: { id: affectedUserId },
                    data: { currentOrgId: otherMembership ? otherMembership.orgId : null }
                });
            }
        }

        // 2. 清除邀请信息（物理删除）
        await tx.invitation.deleteMany({ where: { orgId: id } });

        // 3. 逻辑删除组织
        return tx.organization.update({
            where: { id },
            data: { isDeleted: true }
        });
    });
  }

  async leave(id: number, userId: number) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('组织不存在');
    if (org.ownerId === userId) throw new Error('负责人无法退出，请先转移权限');

    return this.prisma.organizationMember.deleteMany({
      where: {
        orgId: id,
        userId: userId
      }
    });
  }
}
