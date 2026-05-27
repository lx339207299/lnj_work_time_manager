import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { AdminProjectsController } from './admin-projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController, AdminProjectsController],
  providers: [ProjectsService]
})
export class ProjectsModule {}
