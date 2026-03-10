import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class InvitationCodeDto {
  @ApiProperty({ description: 'Invitation Code', example: 'uuid-code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
