import { ApiProperty } from '@nestjs/swagger';

export class UserOrgDto {
  @ApiProperty({ description: 'Organization ID' })
  id: number;

  @ApiProperty({ description: 'Organization Name' })
  name: string;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User phone number' })
  phone: string;

  @ApiProperty({ description: 'User name', required: false })
  name?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Current Organization ID', required: false })
  currentOrgId?: number;

  @ApiProperty({ description: 'Current Organization Details', type: UserOrgDto, required: false })
  currentOrg?: UserOrgDto;

  @ApiProperty({ description: 'User role in current organization', example: 'user' })
  role: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  access_token: string;

  @ApiProperty({ description: 'User Profile Information', type: UserProfileDto })
  user: UserProfileDto;

  @ApiProperty({ description: 'Indicates if the user was just created', required: false })
  isNewUser?: boolean;
}
