import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ListWorkRecordsDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  projectId: number;

  @ApiProperty({ example: '2023-10-01', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: '2023-10', required: false })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
