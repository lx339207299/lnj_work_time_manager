import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListEmployeeDto {
  @ApiPropertyOptional({ description: 'Only show active (non-deleted) employees. Default is true.', default: true })
  onlyActive?: boolean;
}
