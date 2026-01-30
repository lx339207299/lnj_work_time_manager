import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiProperty({ description: 'Employee (Member) ID', example: 'uuid-string' })
  id: string;
}
