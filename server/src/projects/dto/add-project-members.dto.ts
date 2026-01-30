import { ApiProperty } from '@nestjs/swagger';

export class AddProjectMembersDto {
  @ApiProperty({ description: 'Project ID (if passed in body)', required: false, example: 'uuid-project' })
  id?: string;

  @ApiProperty({ example: ['uuid-member-1', 'uuid-member-2'], description: 'Array of OrganizationMember IDs' })
  memberIds: string[];
}
