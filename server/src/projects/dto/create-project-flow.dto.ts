
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectFlowDto {
  @ApiProperty({ example: 'income', enum: ['income', 'expense'] })
  type: string;

  @ApiProperty({ example: '收款' })
  category: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  @ApiProperty({ example: '2023-10-01' })
  date: string;

  @ApiProperty({ example: 'Project initial payment', required: false })
  remark?: string;

  @ApiProperty({ example: 'uuid-related-member', required: false })
  relatedMemberId?: string;
}
