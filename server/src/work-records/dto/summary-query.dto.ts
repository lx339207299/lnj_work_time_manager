import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNumber, IsString, IsIn, IsArray } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class SummaryQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  projectId?: number

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orgId?: number

  @ApiProperty({ example: '2026-02-01', required: false })
  @IsOptional()
  @IsString()
  start?: string

  @ApiProperty({ example: '2026-02-29', required: false })
  @IsOptional()
  @IsString()
  end?: string

  @ApiProperty({ example: ['day', 'week', 'month', 'year'], required: false })
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year', 'custom'])
  granularity?: 'day' | 'week' | 'month' | 'year' | 'custom'

  @ApiProperty({ example: [1, 2, 3], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    }
    return value;
  })
  memberIds?: number[]
}
