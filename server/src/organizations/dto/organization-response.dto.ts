import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @ApiProperty({ description: 'Organization Name' })
  name: string;

  @ApiProperty({ description: 'Organization Description', required: false })
  description?: string;

  @ApiProperty({ description: 'Owner User ID' })
  ownerId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class OrganizationListResponseDto extends OrganizationResponseDto {
  @ApiProperty({ description: 'User role in organization', example: 'owner' })
  role: string;
}

export class OrganizationMemberDto {
    @ApiProperty()
    id: string;
    
    @ApiProperty()
    userId: string;
    
    @ApiProperty()
    name: string;
    
    @ApiProperty()
    role: string;
    
    @ApiProperty()
    status: string;
}

export class OrganizationDetailResponseDto extends OrganizationResponseDto {
    @ApiProperty({ type: [OrganizationMemberDto], description: 'List of members' })
    members: OrganizationMemberDto[];
    
    @ApiProperty({ description: 'List of projects (simplified)', required: false })
    projects: any[]; // Define ProjectDto if needed, keeping it simple for now
}

export class SwitchOrganizationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'Current Organization ID' })
  currentOrgId: string;

  @ApiProperty({ type: OrganizationResponseDto })
  org: OrganizationResponseDto;

  @ApiProperty({ description: 'New Access Token' })
  access_token: string;
}

export class CreateOrganizationResponseDto extends OrganizationResponseDto {
    @ApiProperty({ description: 'User role', example: 'owner' })
    role: string;

    @ApiProperty({ description: 'New Access Token' })
    access_token: string;
}
