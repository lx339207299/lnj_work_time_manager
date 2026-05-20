import { Controller, Post, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/invitations')
@Controller('admin/invitations')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Admin: Create invitation for any org' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orgId: { type: 'number', description: '目标企业 ID', example: 1 },
      },
      required: ['orgId'],
    },
  })
  @ApiResponse({ status: 201, description: '邀请码创建成功' })
  async create(@Body('orgId', ParseIntPipe) orgId: number) {
    const invitation = await this.invitationsService.create(
      { orgId },
      0, // admin inviterId placeholder (0 = system admin)
    );
    return CustomResponse.success(invitation);
  }

  @Post('list')
  @ApiOperation({ summary: 'Admin: List invitations for any org' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orgId: { type: 'number', description: '企业 ID', example: 1 },
      },
      required: ['orgId'],
    },
  })
  @ApiResponse({ status: 200 })
  async list(@Body('orgId', ParseIntPipe) orgId: number) {
    const invitations = await this.invitationsService.findAllByOrg(orgId);
    return CustomResponse.success(invitations);
  }
}
