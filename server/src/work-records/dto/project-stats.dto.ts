import { ApiProperty } from '@nestjs/swagger';

export class ProjectStatsDto {
  @ApiProperty({ example: 1 })
  projectId: number;
}
