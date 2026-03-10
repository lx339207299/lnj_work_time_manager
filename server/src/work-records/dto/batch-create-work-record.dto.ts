import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
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

  @ApiProperty({ type: [WorkRecordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkRecordItemDto)
  records: WorkRecordItemDto[];
}
