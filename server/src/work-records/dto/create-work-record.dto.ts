
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateWorkRecordDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  memberId: number;

  @ApiProperty({ example: '2023-10-01' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: 'Work content', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
