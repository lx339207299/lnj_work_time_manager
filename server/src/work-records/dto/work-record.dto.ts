import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: 1 })
  memberId: number;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ example: 8 })
  duration: number;

  @ApiProperty({ example: 'Work content' })
  content: string;

  @ApiProperty({ example: 100 })
  wageSnapshot: number;

  @ApiProperty({ example: 'day' })
  wageTypeSnapshot: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
