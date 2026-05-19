import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({ description: 'Project ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
