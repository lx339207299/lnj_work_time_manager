import { ApiProperty } from '@nestjs/swagger';

export class OrganizationIdDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-string' })
  id: string;
}
