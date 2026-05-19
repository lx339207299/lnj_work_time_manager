import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { CreateWorkRecordDto } from './create-work-record.dto';

export class UpdateWorkRecordDto extends PartialType(CreateWorkRecordDto) {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
