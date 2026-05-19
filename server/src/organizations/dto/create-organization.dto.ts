
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Organization' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Description of org', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
