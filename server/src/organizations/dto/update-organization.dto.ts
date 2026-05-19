import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiProperty({ description: 'Organization ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
