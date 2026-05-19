import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 1, description: 'Organization ID' })
  @IsNumber()
  @IsNotEmpty()
  orgId: number;
}
