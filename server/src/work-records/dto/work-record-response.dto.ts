import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordResponseDto {
  @ApiProperty({ example: 'uuid-record-id' })
  id: string;

  @ApiProperty({ example: 'uuid-project-id' })
  projectId: string;

  @ApiProperty({ example: 'uuid-user-id' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  userName: string;

  @ApiProperty({ example: 'admin' })
  userRole: string;

  @ApiProperty({ example: 'http://example.com/avatar.png' })
  avatar: string;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ example: 8 })
  duration: number;

  @ApiProperty({ example: 'Work content' })
  content: string;
}
