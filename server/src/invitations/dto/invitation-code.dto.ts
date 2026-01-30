import { ApiProperty } from '@nestjs/swagger';

export class InvitationCodeDto {
  @ApiProperty({ description: 'Invitation Code', example: 'uuid-code' })
  code: string;
}
