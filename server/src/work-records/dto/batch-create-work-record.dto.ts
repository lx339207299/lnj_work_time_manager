import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordItemDto {
  @ApiProperty({ example: 'uuid-member-id' })
  memberId: string;

  @ApiProperty({ example: 8 })
  duration: number;
}

export class BatchCreateWorkRecordDto {
  @ApiProperty({ example: 'uuid-project-id' })
  projectId: string;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ type: [WorkRecordItemDto] })
  records: WorkRecordItemDto[];
}
