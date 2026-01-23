
import { ApiProperty } from '@nestjs/swagger';

export class AddProjectMembersDto {
  @ApiProperty({ example: ['uuid-member-1', 'uuid-member-2'], description: 'Array of OrganizationMember IDs' })
  memberIds: string[];
}
