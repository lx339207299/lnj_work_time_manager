import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Old password', example: '123456' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  oldPassword: string;

  @ApiProperty({ description: 'New password', example: 'Password123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: '新密码必须包含大小写字母和数字' })
  newPassword: string;
}
