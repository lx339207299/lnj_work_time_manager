import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsInt } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiProperty({ description: 'Employee (Member) ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 20000, required: false, description: '薪资，单位：分' })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '薪资必须大于0（单位为分）' })
  wageAmount?: number;
}
