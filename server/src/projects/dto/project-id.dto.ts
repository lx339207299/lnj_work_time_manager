import { ApiProperty } from '@nestjs/swagger';

export class ProjectIdDto {
  @ApiProperty({ description: 'Project ID', example: 'uuid-string' })
  id: string;
}
