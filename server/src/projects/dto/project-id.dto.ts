import { ApiProperty } from '@nestjs/swagger';

export class ProjectIdDto {
  @ApiProperty({ description: 'Project ID', example: 1 })
  id: number;
}
