import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class AddProjectMembersDto {
  @ApiProperty({ description: 'Project ID (if passed in body)', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: [1, 2], description: 'Array of OrganizationMember IDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  memberIds: number[];
}
