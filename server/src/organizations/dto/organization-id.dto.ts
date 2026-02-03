import { ApiProperty } from '@nestjs/swagger';

export class OrganizationIdDto {
  @ApiProperty({ description: 'Organization ID', example: 1 })
  id: number;
}
