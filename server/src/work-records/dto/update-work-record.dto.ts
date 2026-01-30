import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWorkRecordDto } from './create-work-record.dto';

export class UpdateWorkRecordDto extends PartialType(CreateWorkRecordDto) {
  @ApiProperty({ example: 'uuid-record-id' })
  id: string;
}
