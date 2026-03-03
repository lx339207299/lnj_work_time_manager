
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: '密码必须包含大小写字母和数字' })
  password?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'http://avatar.url', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
