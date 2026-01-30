import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordIdDto {
  @ApiProperty({ example: 'uuid-record-id' })
  id: string;
}
