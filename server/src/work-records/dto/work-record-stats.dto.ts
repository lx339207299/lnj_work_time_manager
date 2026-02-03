import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordStatsDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'John Doe' })
  userName: string;

  @ApiProperty({ example: 'http://example.com/avatar.png' })
  userAvatar: string;

  @ApiProperty({ example: 'member' })
  userRole: string;

  @ApiProperty({ example: 40 })
  totalDuration: number;

  @ApiProperty({ example: 'day' })
  wageType: string;
}
