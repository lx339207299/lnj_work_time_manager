import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/dashboard')
@Controller('admin/dashboard')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '统计总览' })
  async overview() {
    const data = await this.dashboardService.getOverview();
    return CustomResponse.success(data);
  }

  @Get('user-trend')
  @ApiOperation({ summary: '用户增长趋势' })
  async userTrend(@Query('days') days?: string) {
    const data = await this.dashboardService.getUserTrend(Number(days) || 30);
    return CustomResponse.success(data);
  }

  @Get('work-hour-trend')
  @ApiOperation({ summary: '工时趋势' })
  async workHourTrend(@Query('days') days?: string) {
    const data = await this.dashboardService.getWorkHourTrend(Number(days) || 30);
    return CustomResponse.success(data);
  }

  @Get('org-ranking')
  @ApiOperation({ summary: '组织工时排行' })
  async orgRanking(@Query('limit') limit?: string) {
    const data = await this.dashboardService.getOrgRanking(Number(limit) || 10);
    return CustomResponse.success(data);
  }
}
