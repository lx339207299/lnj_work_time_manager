
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkRecordDto {
  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: 1 })
  memberId: number;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ example: 8 })
  duration: number;

  @ApiProperty({ example: 'Work content', required: false })
  content?: string;
}
