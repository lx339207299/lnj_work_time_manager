
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'uuid-org-id' })
  orgId: string;

  @ApiProperty({ example: 'Project Name' })
  name: string;

  @ApiProperty({ example: 'Description of project', required: false })
  description?: string;
}
