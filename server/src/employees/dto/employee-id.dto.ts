import { ApiProperty } from '@nestjs/swagger';

export class EmployeeIdDto {
  @ApiProperty({ description: 'Employee (Member) ID', example: 'uuid-string' })
  id: string;
}
