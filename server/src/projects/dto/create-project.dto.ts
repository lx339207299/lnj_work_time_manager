import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  // @ApiProperty({ description: 'Organization ID', required: false, hidden: true })
  @IsOptional()
  @IsNumber()
  orgId: number;

  @ApiProperty({ example: 'Project Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Description of project', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
