import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
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
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create invitation' })
  @ApiResponse({ status: 201, type: InvitationResponseDto })
  create(@Request() req) {
    const createInvitationDto = new CreateInvitationDto();
    createInvitationDto.orgId = req.user.orgId;
    return this.invitationsService.create(createInvitationDto, req.user.sub);
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
  accept(@Body() body: InvitationCodeDto, @Request() req) {
    return this.invitationsService.accept(body.code, req.user.sub);
  }
}
