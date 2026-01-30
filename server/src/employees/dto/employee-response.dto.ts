import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Employee (Member) ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  orgId: string;

  @ApiProperty({ description: 'User ID (if linked)', required: false })
  userId?: string;

  @ApiProperty({ description: 'Employee Name' })
  name: string;

  @ApiProperty({ description: 'Employee Phone' })
  phone: string;

  @ApiProperty({ description: 'Role in Organization', example: 'member' })
  role: string;

  @ApiProperty({ description: 'Wage Type', example: 'day' })
  wageType: string;

  @ApiProperty({ description: 'Wage Amount', example: 100 })
  wageAmount: number;

  @ApiProperty({ description: 'Birthday', required: false })
  birthday?: string;

  @ApiProperty({ description: 'Status', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class EmployeeListResponseDto extends EmployeeResponseDto {
  @ApiProperty({ description: 'Linked User Info', type: UserProfileDto, required: false })
  user?: UserProfileDto;
}
