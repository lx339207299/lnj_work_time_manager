
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
        status: 'active'
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
    // Find orgs where user is a member
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => ({
      ...m.organization,
      role: m.role, // Include role in the list
    }));
  }

  async findOne(id: number) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
          members: true,
          projects: true
      }
    });
  }

  async update(id: number, userId: number, updateDto: any) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can update organization');

    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, userId: number) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can delete organization');

    // Transactional delete to ensure cleanup
    return this.prisma.$transaction(async (tx: any) => {
        // 1. 处理其他成员：将所有当前选中该组织的用户（排除当前用户）的 currentOrgId 置为 null
        // 防止外键约束报错，同时让其他成员状态回归"无组织"
        await tx.user.updateMany({
            where: { 
                currentOrgId: id,
                id: { not: userId } 
            },
            data: { currentOrgId: null }
        });

        // 2. 处理当前用户：查找并切换到第一个有效组织
        const user = await tx.user.findUnique({ 
            where: { id: userId },
            select: { currentOrgId: true }
        });

        if (user?.currentOrgId === id) {
            // 查找该用户加入的第一个其他组织（按加入时间排序）
            // 注意：此时 organizationMember 还没删，所以要排除当前组织
            const otherMembership = await tx.organizationMember.findFirst({
                where: { 
                    userId: userId,
                    orgId: { not: id },
                    status: 'active'
                },
                orderBy: { createdAt: 'asc' }
            });

            await tx.user.update({
                where: { id: userId },
                data: { currentOrgId: otherMembership ? otherMembership.orgId : null }
            });
        }

        // 3. 删除所有成员关系
        await tx.organizationMember.deleteMany({ where: { orgId: id } });
        
        // 4. 删除组织
        return tx.organization.delete({ where: { id } });
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
