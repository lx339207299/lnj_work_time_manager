import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    return this.invitationsService.create(createInvitationDto, req.user.sub);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.invitationsService.findOne(code);
  }

  @Post(':code/accept')
  accept(@Param('code') code: string, @Request() req) {
    return this.invitationsService.accept(code, req.user.sub);
  }
}
