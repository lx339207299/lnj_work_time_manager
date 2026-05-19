import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class EmployeeIdDto {
  @ApiProperty({ description: 'Employee (Member) ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
