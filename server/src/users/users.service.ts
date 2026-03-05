
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
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

  // --- Admin Methods ---

  async findAllForAdmin(page: number, pageSize: number, keyword?: string, orgName?: string) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.UserWhereInput = {
      ...(keyword ? {
          OR: [
            { phone: { contains: keyword } },
            { name: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        } : {}),
      ...(orgName ? {
          currentOrg: {
            name: { contains: orgName }
          }
      } : {})
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          currentOrg: { select: { id: true, name: true } },
          _count: { select: { ownedOrgs: true, memberships: true } },
        },
      }),
    ]);

    return {
      total,
      list: users.map(user => {
        const { password, ...rest } = user;
        return rest;
      }),
    };
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
