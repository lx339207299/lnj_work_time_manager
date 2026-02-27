
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { BatchCreateEmployeeDto } from './dto/batch-create-employee.dto';
import { EmployeeIdDto } from './dto/employee-id.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto, EmployeeListResponseDto } from './dto/employee-response.dto';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('employees')
@Controller('employees')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('create')
  @ApiOperation({ summary: 'Add employee to organization' })
  @ApiResponse({ status: 201, type: EmployeeResponseDto })
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req: any) {
    createEmployeeDto.orgId = req.user.orgId;
    return this.employeesService.create(createEmployeeDto);
  }

  @Post('batch-create')
  @ApiOperation({ summary: 'Batch add employees to organization' })
  @ApiResponse({ status: 201, description: 'Batch create results' })
  batchCreate(@Body() batchDto: BatchCreateEmployeeDto, @Request() req: any) {
    return this.employeesService.batchCreate(req.user.orgId, batchDto.employees);
  }

  @Post('list')
  @ApiOperation({ summary: 'Get employees list' })
  @ApiResponse({ status: 200, type: [EmployeeListResponseDto] })
  findAll(@Request() req: any, @Body() body: ListEmployeeDto) {
    return this.employeesService.findAll(req.user.orgId, body.onlyActive ?? true);
  }

  @Post('detail')
  @ApiOperation({ summary: 'Get employee details' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  findOne(@Body() body: EmployeeIdDto) {
    return this.employeesService.findOne(body.id);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update employee details' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  update(@Body() updateEmployeeDto: UpdateEmployeeDto) {
    const { id, ...updateData } = updateEmployeeDto;
    return this.employeesService.update(id, updateData);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Remove employee' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  remove(@Body() body: EmployeeIdDto) {
    return this.employeesService.remove(body.id);
  }

  @Post('transfer-ownership')
  @ApiOperation({ summary: 'Transfer organization ownership to employee' })
  @ApiResponse({ status: 200, description: 'Transaction result' })
  transferOwnership(@Request() req: any, @Body() body: EmployeeIdDto) {
    return this.employeesService.transferOwnership(body.id, req.user.userId);
  }
}
