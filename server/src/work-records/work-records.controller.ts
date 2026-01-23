
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('work-records')
@UseGuards(AuthGuard('jwt'))
export class WorkRecordsController {
  constructor(private readonly workRecordsService: WorkRecordsService) {}

  @Post()
  create(@Body() createWorkRecordDto: CreateWorkRecordDto) {
    return this.workRecordsService.create(createWorkRecordDto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @Query('date') date?: string) {
    return this.workRecordsService.findAll(projectId, date);
  }
}
