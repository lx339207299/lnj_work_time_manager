import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { EmployeesModule } from './employees/employees.module';
import { WorkRecordsModule } from './work-records/work-records.module';
import { AuthModule } from './auth/auth.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MailModule } from './mail/mail.module';
import { StaticPagesModule } from './static-pages/static-pages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SystemLogsModule } from './system-logs/system-logs.module';

@Module({
  imports: [PrismaModule, UsersModule, OrganizationsModule, ProjectsModule, EmployeesModule, WorkRecordsModule, AuthModule, InvitationsModule, MailModule, StaticPagesModule, DashboardModule, SystemLogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
