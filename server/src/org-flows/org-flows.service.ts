import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgFlowDto } from './dto/create-org-flow.dto';

@Injectable()
export class OrgFlowsService {
  constructor(private prisma: PrismaService) {}

  // 组织流水列表（按组织隔离；可选按月筛选），带关联成员姓名
  async findAll(orgId: number, month?: string) {
    const where: any = { orgId };
    if (month) {
      where.date = { startsWith: month };
    }

    const list = await this.prisma.organizationFlow.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      include: {
        relatedMember: { include: { user: true } },
      },
    });

    return list.map((f) => ({
      id: f.id,
      type: f.type,
      category: f.category,
      amount: f.amount,
      date: f.date,
      remark: f.remark,
      relatedUserId: f.relatedMemberId,
      relatedUserName: f.relatedMember?.user?.name || f.relatedMember?.user?.phone,
    }));
  }

  async create(dto: CreateOrgFlowDto) {
    return this.prisma.organizationFlow.create({
      data: {
        orgId: dto.orgId,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        date: dto.date,
        remark: dto.remark,
        relatedMemberId: dto.relatedMemberId,
      },
    });
  }

  async remove(id: number, orgId: number) {
    const flow = await this.prisma.organizationFlow.findUnique({ where: { id } });
    if (!flow) throw new NotFoundException('Flow not found');
    if (flow.orgId !== orgId) {
      throw new ForbiddenException('Flow does not belong to your current organization');
    }
    return this.prisma.organizationFlow.delete({ where: { id } });
  }
}
