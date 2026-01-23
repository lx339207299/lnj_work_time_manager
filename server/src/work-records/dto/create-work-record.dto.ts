
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkRecordDto {
  @ApiProperty({ example: 'uuid-project-id' })
  projectId: string;

  @ApiProperty({ example: 'uuid-member-id' })
  memberId: string;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ example: 8 })
  duration: number;

  @ApiProperty({ example: 'Work content', required: false })
  content?: string;
}
