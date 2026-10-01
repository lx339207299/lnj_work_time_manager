import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListOrgFlowsDto {
  @ApiProperty({ example: '2026-10', required: false, description: '按月筛选（YYYY-MM），不传查全部' })
  @IsOptional()
  @IsString()
  month?: string;
}
