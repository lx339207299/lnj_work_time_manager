import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordItemDto {
  @ApiProperty({ example: 1 })
  memberId: number;

  @ApiProperty({ example: 8 })
  duration: number;
}

export class BatchCreateWorkRecordDto {
  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ type: [WorkRecordItemDto] })
  records: WorkRecordItemDto[];
}
