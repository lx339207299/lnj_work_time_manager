import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsInt } from 'class-validator';

export class CreateEmployeeDto {
  // @ApiProperty({ example: 'uuid-org-id', hidden: true })
  @IsOptional()
  @IsNumber()
  orgId: number;

  @ApiProperty({ example: '13900139000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '张三', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiProperty({ example: 'member', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 'day', required: false })
  @IsOptional()
  @IsString()
  wageType?: string;

  @ApiProperty({ example: 20000, required: true, description: '薪资，单位：分' })
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: '薪资必须大于0（单位为分）' })
  wageAmount: number;
}
