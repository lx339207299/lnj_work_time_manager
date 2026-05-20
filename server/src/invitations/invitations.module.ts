import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InvitationsController, AdminInvitationsController],
  providers: [InvitationsService, PrismaService],
})
export class InvitationsModule {}
