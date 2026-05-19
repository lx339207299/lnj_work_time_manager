import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class ProjectIdDto {
  @ApiProperty({ description: 'Project ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
