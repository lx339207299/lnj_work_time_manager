import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class RegisterWithPasswordDto {
  @ApiProperty({ example: '13800138000', description: 'User phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Password123', description: 'User password' })
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: '密码必须包含大小写字母和数字' })
  password: string;
}
