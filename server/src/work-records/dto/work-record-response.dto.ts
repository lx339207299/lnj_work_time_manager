import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: 1 })
  userId: number;

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
