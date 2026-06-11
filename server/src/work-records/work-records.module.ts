import { Module } from '@nestjs/common';
import { WorkRecordsController } from './work-records.controller';
import { AdminWorkRecordsController } from './admin-work-records.controller';
import { AdminWorkRecordLogsController } from './admin-work-record-logs.controller';
import { WorkRecordsService } from './work-records.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkRecordsController, AdminWorkRecordsController, AdminWorkRecordLogsController],
  providers: [WorkRecordsService]
})
export class WorkRecordsModule {}
