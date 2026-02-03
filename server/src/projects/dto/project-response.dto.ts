import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({ description: 'Project ID' })
  id: number;

  @ApiProperty({ description: 'Project Name' })
  name: string;

  @ApiProperty({ description: 'Project Description', required: false })
  description?: string;

  @ApiProperty({ description: 'User role in project', example: 'owner' })
  role: string;

  @ApiProperty({ description: 'Member count' })
  memberCount: number;

  @ApiProperty({ description: 'Total work hours' })
  totalHours: number;

  @ApiProperty({ description: 'Total work days (approx)' })
  totalDays: number;
}

export class ProjectMemberDto {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    name: string;
    
    @ApiProperty()
    role: string;
    
    @ApiProperty()
    wageType: string;
    
    @ApiProperty()
    avatar: string;
}

export class ProjectFlowDto {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    projectId: number;
    
    @ApiProperty()
    type: string;
    
    @ApiProperty()
    category: string;
    
    @ApiProperty()
    amount: number;
    
    @ApiProperty()
    date: string;
    
    @ApiProperty({ required: false })
    remark?: string;
    
    @ApiProperty({ required: false })
    relatedMemberId?: number;
}
