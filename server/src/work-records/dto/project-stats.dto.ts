import { ApiProperty } from '@nestjs/swagger';

export class ProjectStatsDto {
  @ApiProperty({ example: 'uuid-project-id' })
  projectId: string;
}
