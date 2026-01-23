
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('work-records')
@Controller('work-records')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WorkRecordsController {
  constructor(private readonly workRecordsService: WorkRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create work record' })
  create(@Body() createWorkRecordDto: CreateWorkRecordDto) {
    return this.workRecordsService.create(createWorkRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get work records list' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Query('projectId') projectId: string, 
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    return this.workRecordsService.findAll(projectId, date, month, page, pageSize);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project member stats' })
  @ApiQuery({ name: 'projectId', required: true })
  getStats(@Query('projectId') projectId: string) {
    return this.workRecordsService.getStats(projectId);
  }
}
