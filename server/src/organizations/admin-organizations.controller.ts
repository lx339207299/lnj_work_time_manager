import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/organizations')
@Controller('admin/organizations')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminOrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all organizations' })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    const p = page || 1;
    const ps = pageSize || 20;
    const { list, total } = await this.organizationsService.findAllForAdmin(p, ps, keyword);
    
    return CustomResponse.success(list, undefined, {
      total,
      pageSize: ps,
      currentPage: p,
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Enable/Disable organization' })
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isDeleted: boolean },
  ) {
    return this.organizationsService.setOrgStatus(id, body.isDeleted);
  }
}
