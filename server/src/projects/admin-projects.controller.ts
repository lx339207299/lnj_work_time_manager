import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/projects')
@Controller('admin/projects')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: 项目列表' })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('keyword') keyword?: string) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const { list, total } = await this.projectsService.findAllForAdmin(p, ps, keyword);
    return CustomResponse.success(list, undefined, { total, pageSize: ps, currentPage: p });
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Admin: 修改项目状态' })
  async setStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const project = await this.projectsService.setProjectStatus(+id, body.status);
    return CustomResponse.success(project);
  }
}
