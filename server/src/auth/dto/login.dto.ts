
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '13800138000', description: 'User phone number' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Verification code', required: false })
  code?: string;

  @ApiProperty({ example: 'password123', description: 'User password', required: false })
  password?: string;
}
