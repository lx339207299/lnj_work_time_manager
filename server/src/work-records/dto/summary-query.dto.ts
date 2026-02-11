import { ApiProperty } from '@nestjs/swagger'

export class SummaryQueryDto {
  @ApiProperty({ example: 1, required: false })
  projectId?: number

  @ApiProperty({ example: 1, required: false })
  orgId?: number

  @ApiProperty({ example: '2026-02-01', required: false })
  start?: string

  @ApiProperty({ example: '2026-02-29', required: false })
  end?: string

  @ApiProperty({ example: ['day', 'week', 'month', 'year'], required: false })
  granularity?: 'day' | 'week' | 'month' | 'year' | 'custom'

  @ApiProperty({ example: [1, 2, 3], required: false })
  memberIds?: number[]
}
