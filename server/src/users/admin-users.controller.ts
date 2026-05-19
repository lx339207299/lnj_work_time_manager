import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminUserQueryDto, AdminUserLockDto, AdminResetPasswordDto } from './dto/admin-user.dto';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get user list' })
  async findAll(@Query() query: AdminUserQueryDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const { list, total } = await this.usersService.findAllForAdmin(page, pageSize, query.keyword, query.orgName);
    
    return CustomResponse.success(list, undefined, {
      total,
      pageSize,
      currentPage: page
    });
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Admin: Lock/Unlock user' })
  async setLockStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminUserLockDto
  ) {
    return this.usersService.setLockStatus(id, body.isLocked);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Admin: Reset user password' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminResetPasswordDto
  ) {
    return this.usersService.adminResetPassword(id, body.newPassword);
  }
}
