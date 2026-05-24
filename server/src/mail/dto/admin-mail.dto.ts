import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminMailQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Search keyword (to or subject)' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class AdminSendMailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Email subject' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email HTML content' })
  @IsNotEmpty()
  @IsString()
  html: string;
}
