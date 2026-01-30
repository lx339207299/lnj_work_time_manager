import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordDto {
  @ApiProperty({ example: 'uuid-record-id' })
  id: string;

  @ApiProperty({ example: 'uuid-project-id' })
  projectId: string;

  @ApiProperty({ example: 'uuid-member-id' })
  memberId: string;

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
