import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-string' })
  id: string;
}
