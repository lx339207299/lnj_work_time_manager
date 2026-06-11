import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('admin/work-record-logs')
@Controller('admin/work-record-logs')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminWorkRecordLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: 工时操作日志列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('orgId') orgId?: string,
    @Query('projectId') projectId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;

    const where: any = {};
    if (orgId) where.orgId = Number(orgId);
    if (projectId) where.projectId = Number(projectId);
    if (action) where.action = action;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }
    if (keyword) {
      where.OR = [
        { operator: { phone: { contains: keyword } } },
        { operator: { name: { contains: keyword } } },
        { oldData: { contains: keyword } },
        { newData: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.workRecordLog.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.workRecordLog.count({ where }),
    ]);

    // 批量查询 OrganizationMember 以解析 targetMemberId -> 成员名
    const memberIds = [...new Set(list.map((l) => l.targetMemberId))];
    let memberNameMap = new Map<number, string>();

    if (memberIds.length > 0) {
      const members = await this.prisma.organizationMember.findMany({
        where: { id: { in: memberIds } },
        include: { user: { select: { id: true, name: true, phone: true } } },
      });

      for (const m of members) {
        memberNameMap.set(
          m.id,
          m.user?.name || m.user?.phone || `成员${m.id}`,
        );
      }
    }

    const data = list.map((log) => ({
      id: log.id,
      orgId: log.orgId,
      projectId: log.projectId,
      workRecordId: log.workRecordId,
      date: log.date,
      action: log.action,
      oldData: log.oldData,
      newData: log.newData,
      createdAt: log.createdAt,
      operatorId: log.operatorId,
      operatorName: log.operator?.name || log.operator?.phone || `用户${log.operatorId}`,
      targetMemberId: log.targetMemberId,
      targetMemberName: memberNameMap.get(log.targetMemberId) || '-',
    }));

    return CustomResponse.success(data, undefined, {
      total,
      pageSize: ps,
      currentPage: p,
    });
  }
}
