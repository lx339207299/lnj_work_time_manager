import { Module } from '@nestjs/common';
import { OrgFlowsController } from './org-flows.controller';
import { OrgFlowsService } from './org-flows.service';

@Module({
  controllers: [OrgFlowsController],
  providers: [OrgFlowsService]
})
export class OrgFlowsModule {}
