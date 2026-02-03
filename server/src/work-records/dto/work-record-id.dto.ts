import { ApiProperty } from '@nestjs/swagger';

export class WorkRecordIdDto {
  @ApiProperty({ example: 1 })
  id: number;
}
