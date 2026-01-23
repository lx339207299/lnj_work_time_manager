import { Module } from '@nestjs/common';
import { WorkRecordsController } from './work-records.controller';
import { WorkRecordsService } from './work-records.service';

@Module({
  controllers: [WorkRecordsController],
  providers: [WorkRecordsService]
})
export class WorkRecordsModule {}
