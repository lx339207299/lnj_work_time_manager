import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class OrganizationIdDto {
  @ApiProperty({ description: 'Organization ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
