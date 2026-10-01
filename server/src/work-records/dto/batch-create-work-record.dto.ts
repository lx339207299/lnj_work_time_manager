import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkRecordItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  memberId: number;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @IsNotEmpty()
  duration: number;
}

export class BatchCreateWorkRecordDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({ example: '2023-10-01' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '加班到晚上10点', required: false, description: '批次备注，写入本批每条记录' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ type: [WorkRecordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkRecordItemDto)
  records: WorkRecordItemDto[];
}
