
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(phone: string): Promise<User | null> {
    if (!phone) return null;
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByOpenid(openid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { openid },
    });
  }

  async findById(id: number): Promise<User | null> {
    if (!id) return null;
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdWithOrgs(id: number) {
    if (!id) return null;
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { organization: true },
          where: { status: 'active' }
        },
        currentOrg: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    let hashedPassword = undefined;
    if (data.password) {
        const salt = await bcrypt.genSalt();
        hashedPassword = await bcrypt.hash(data.password, salt);
    }
    
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  // --- Admin Methods ---

  async findAllForAdmin(page: number, pageSize: number, keyword?: string, orgName?: string) {
    const userWhere: Prisma.UserWhereInput = {
      ...(keyword ? {
        OR: [
          { phone: { contains: keyword } },
          { name: { contains: keyword } },
          { email: { contains: keyword } },
        ],
      } : {}),
    };

    // 查询所有匹配的用户及其活跃的 memberships
    const users = await this.prisma.user.findMany({
      where: userWhere,
      include: {
        memberships: {
          where: {
            isDeleted: false,
            ...(orgName ? {
              organization: { name: { contains: orgName } }
            } : {})
          },
          include: {
            organization: true,
          },
        },
        _count: { select: { ownedOrgs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 展开为 user + org 多行
    const rows: any[] = [];
    for (const user of users) {
      const { password, memberships, _count, ...userInfo } = user;
      
      if (memberships.length === 0 && !orgName) {
        // 无组织的用户：显示一行，组织信息为空
        rows.push({
          _key: `${userInfo.id}-none`,
          userId: userInfo.id,
          phone: userInfo.phone,
          name: userInfo.name,
          email: userInfo.email,
          systemRole: userInfo.systemRole,
          isLocked: userInfo.isLocked,
          createdAt: userInfo.createdAt,
          ownedOrgsCount: _count?.ownedOrgs ?? 0,
          orgId: null,
          orgName: null,
          orgRole: null,
          memberStatus: null,
        });
      } else {
        for (const m of memberships) {
          rows.push({
            _key: `${userInfo.id}-${m.organization.id}`,
            userId: userInfo.id,
            phone: userInfo.phone,
            name: userInfo.name,
            email: userInfo.email,
            systemRole: userInfo.systemRole,
            isLocked: userInfo.isLocked,
            createdAt: userInfo.createdAt,
            ownedOrgsCount: _count?.ownedOrgs ?? 0,
            orgId: m.organization.id,
            orgName: m.organization.name,
            orgRole: m.role,
            memberStatus: m.status,
          });
        }
      }
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const list = rows.slice(start, start + pageSize);

    return { total, list };
  }

  async setLockStatus(userId: number, isLocked: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isLocked },
    });
  }

  async adminResetPassword(userId: number, newPassword: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
