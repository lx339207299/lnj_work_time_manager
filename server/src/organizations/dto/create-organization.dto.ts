
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Organization' })
  name: string;

  @ApiProperty({ example: 'Description of org', required: false })
  description?: string;
}
