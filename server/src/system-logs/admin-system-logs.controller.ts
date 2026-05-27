import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('admin/system-logs')
@Controller('admin/system-logs')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminSystemLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: 系统日志列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('keyword') keyword?: string,
  ) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;

    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (keyword) {
      where.OR = [
        { detail: { contains: keyword } },
        { user: { phone: { contains: keyword } } },
        { user: { name: { contains: keyword } } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return CustomResponse.success(list, undefined, { total, pageSize: ps, currentPage: p });
  }
}
