import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiProperty({ description: 'Employee (Member) ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: '薪资必须大于0' })
  wageAmount?: number;
}
