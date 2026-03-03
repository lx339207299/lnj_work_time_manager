import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'http://avatar.url', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsString()
  birthday?: string;
}
