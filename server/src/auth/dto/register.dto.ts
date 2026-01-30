import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '13800138000' })
  phone: string;

  @ApiProperty({ example: 'password123', required: false })
  password?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'http://avatar.url', required: false })
  avatar?: string;
}
