import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsIn, IsNotEmpty } from 'class-validator';

export class CreateProjectFlowDto {
  @ApiProperty({ description: 'Project ID (if passed in body)', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 'income', enum: ['income', 'expense'] })
  @IsString()
  @IsIn(['income', 'expense'])
  type: string;

  @ApiProperty({ example: '收款' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2023-10-01' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Project initial payment', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  relatedMemberId?: number;
}
