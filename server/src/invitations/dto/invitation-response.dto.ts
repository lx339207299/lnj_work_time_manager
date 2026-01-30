import { ApiProperty } from '@nestjs/swagger';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class InvitationResponseDto {
  @ApiProperty({ description: 'Invitation ID' })
  id: string;

  @ApiProperty({ description: 'Invitation Code' })
  code: string;

  @ApiProperty({ description: 'Organization ID' })
  orgId: string;

  @ApiProperty({ description: 'Inviter User ID' })
  inviterId: string;

  @ApiProperty({ description: 'Status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Expiration Date' })
  expiresAt: Date;

  @ApiProperty({ description: 'Creation Date' })
  createdAt: Date;
  
  @ApiProperty({ description: 'Organization Info', required: false })
  organization?: OrganizationResponseDto;
  
  @ApiProperty({ description: 'Inviter Info', required: false })
  inviter?: UserProfileDto;
}
