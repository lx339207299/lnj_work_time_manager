
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('employees')
@Controller('employees')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Add employee to organization' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get employees list' })
  @ApiQuery({ name: 'orgId', required: true })
  findAll(@Query('orgId') orgId: string) {
    return this.employeesService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee details' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee details' })
  update(@Param('id') id: string, @Body() updateEmployeeDto: any) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove employee' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer organization ownership to employee' })
  transferOwnership(@Request() req: any, @Param('id') id: string) {
    return this.employeesService.transferOwnership(id, req.user.userId);
  }
}
