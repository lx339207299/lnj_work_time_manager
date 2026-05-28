import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrganizationsModule, AuthModule],
  controllers: [InvitationsController, AdminInvitationsController],
  providers: [InvitationsService, PrismaService],
})
export class InvitationsModule {}
