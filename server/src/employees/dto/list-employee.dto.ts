import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListEmployeeDto {
  @ApiPropertyOptional({ description: 'Only show active (non-deleted) employees. Default is true.', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  onlyActive?: boolean;
}
