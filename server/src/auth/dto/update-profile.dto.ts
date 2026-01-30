import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'http://avatar.url', required: false })
  avatar?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  birthday?: string;
}
