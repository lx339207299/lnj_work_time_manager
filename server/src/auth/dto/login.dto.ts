
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '13800138000', description: 'User phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123', description: 'User password', required: false })
  @IsOptional()
  @IsString()
  password?: string;
}
