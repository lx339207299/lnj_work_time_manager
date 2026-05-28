import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationCodeDto } from './dto/invitation-code.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create invitation' })
  @ApiResponse({ status: 201, type: InvitationResponseDto })
  create(@Request() req) {
    const createInvitationDto = new CreateInvitationDto();
    createInvitationDto.orgId = req.user.orgId;
    return this.invitationsService.create(createInvitationDto, req.user);
  }

  @Post('detail')
  @ApiOperation({ summary: 'Get invitation details' })
  @ApiResponse({ status: 200, type: InvitationResponseDto })
  findOne(@Body() body: InvitationCodeDto) {
    return this.invitationsService.findOne(body.code);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation' })
  @ApiResponse({ status: 200, description: 'Member created' })
  async accept(@Body() body: InvitationCodeDto, @Request() req) {
    const member = await this.invitationsService.accept(body.code, req.user.sub);
    // 自动切换到新组织
    await this.organizationsService.switchToOrg(req.user.sub, member.orgId);
    return member;
  }

  @Post('list')
  @ApiOperation({ summary: 'List invitations for current org' })
  @ApiResponse({ status: 200 })
  list(@Request() req) {
    return this.invitationsService.findAllByOrg(req.user.orgId);
  }
}
