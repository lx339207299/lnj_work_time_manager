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

@Module({
  imports: [PrismaModule, UsersModule, OrganizationsModule, ProjectsModule, EmployeesModule, WorkRecordsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
