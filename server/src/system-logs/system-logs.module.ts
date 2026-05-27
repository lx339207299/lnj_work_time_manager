import { Module } from '@nestjs/common';
import { AdminSystemLogsController } from './admin-system-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminSystemLogsController],
})
export class SystemLogsModule {}
