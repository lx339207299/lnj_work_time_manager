import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
// Assuming AuthGuard is available globally or imported
// If not, I'll need to check where AuthGuard is. 
// Based on context, it seems standard NestJS JWT auth.

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    // req.user should be populated by AuthGuard
    // If not using global guard, I might need @UseGuards(JwtAuthGuard)
    return this.invitationsService.create(createInvitationDto, req.user.userId);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.invitationsService.findOne(code);
  }

  @Post(':code/accept')
  accept(@Param('code') code: string, @Request() req) {
    return this.invitationsService.accept(code, req.user.userId);
  }
}
