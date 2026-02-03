import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  // @ApiProperty({ description: 'Organization ID', required: false, hidden: true })
  orgId: number;

  @ApiProperty({ example: 'Project Name' })
  name: string;

  @ApiProperty({ example: 'Description of project', required: false })
  description?: string;
}
