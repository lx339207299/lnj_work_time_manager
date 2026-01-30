
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { UpdateWorkRecordDto } from './dto/update-work-record.dto';
import { ListWorkRecordsDto } from './dto/list-work-records.dto';
import { ProjectStatsDto } from './dto/project-stats.dto';
import { WorkRecordIdDto } from './dto/work-record-id.dto';
import { BatchCreateWorkRecordDto } from './dto/batch-create-work-record.dto';
import { WorkRecordResponseDto } from './dto/work-record-response.dto';
import { WorkRecordStatsDto } from './dto/work-record-stats.dto';
import { WorkRecordDto } from './dto/work-record.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('work-records')
@Controller('work-records')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WorkRecordsController {
  constructor(private readonly workRecordsService: WorkRecordsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create work record' })
  @ApiResponse({ status: 200, type: WorkRecordDto })
  create(@Body() createWorkRecordDto: CreateWorkRecordDto) {
    return this.workRecordsService.create(createWorkRecordDto);
  }

  @Post('list')
  @ApiOperation({ summary: 'Get work records list' })
  @ApiResponse({ status: 200, type: WorkRecordResponseDto })
  findAll(@Body() body: ListWorkRecordsDto) {
    const { projectId, date, month, page, pageSize } = body;
    return this.workRecordsService.findAll(projectId, date, month, page, pageSize);
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get project member stats' })
  @ApiResponse({ status: 200, type: [WorkRecordStatsDto] })
  getStats(@Body() body: ProjectStatsDto) {
    return this.workRecordsService.getStats(body.projectId);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update work record' })
  @ApiResponse({ status: 200, type: WorkRecordDto })
  update(@Body() body: UpdateWorkRecordDto) {
      const { id, ...data } = body;
      return this.workRecordsService.update(id, data);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete work record' })
  @ApiResponse({ status: 200, type: WorkRecordDto })
  remove(@Body() body: WorkRecordIdDto) {
      return this.workRecordsService.remove(body.id);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch create work records' })
  @ApiResponse({ status: 200, type: [WorkRecordDto] })
  batchCreate(@Body() body: BatchCreateWorkRecordDto) {
      return this.workRecordsService.batchCreate(body);
  }
}
