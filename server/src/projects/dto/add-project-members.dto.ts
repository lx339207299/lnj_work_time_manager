import { ApiProperty } from '@nestjs/swagger';

export class AddProjectMembersDto {
  @ApiProperty({ description: 'Project ID (if passed in body)', required: false, example: 1 })
  id?: number;

  @ApiProperty({ example: [1, 2], description: 'Array of OrganizationMember IDs' })
  memberIds: number[];
}
