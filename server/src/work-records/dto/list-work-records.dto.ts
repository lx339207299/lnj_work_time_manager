import { ApiProperty } from '@nestjs/swagger';

export class ListWorkRecordsDto {
  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: '2023-10-01', required: false })
  date?: string;

  @ApiProperty({ example: '2023-10', required: false })
  month?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  pageSize?: number;
}
