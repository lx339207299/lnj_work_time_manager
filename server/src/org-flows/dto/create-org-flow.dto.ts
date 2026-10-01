import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, IsIn, IsInt } from 'class-validator';

export class CreateOrgFlowDto {
  @ApiProperty({ example: 1, description: 'Organization ID (injected from JWT)', required: false })
  @IsOptional()
  @IsNumber()
  orgId: number;

  @ApiProperty({ example: 'expense', enum: ['income', 'expense'] })
  @IsString()
  @IsIn(['income', 'expense'])
  type: string;

  @ApiProperty({ example: '工资' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 100000, description: '金额，单位：分' })
  @IsInt()
  amount: number;

  @ApiProperty({ example: '2026-10-01' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ example: 1, required: false, description: '关联成员（如工资发给哪个工人）' })
  @IsOptional()
  @IsNumber()
  relatedMemberId?: number;
}
