import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  // @ApiProperty({ example: 'uuid-org-id', hidden: true })
  orgId: number;

  @ApiProperty({ example: '13900139000' })
  phone: string;

  @ApiProperty({ example: '张三', required: false })
  name?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  birthday?: string;

  @ApiProperty({ example: 'member', required: false })
  role?: string;

  @ApiProperty({ example: 'day', required: false })
  wageType?: string;

  @ApiProperty({ example: 100, required: false })
  wageAmount?: number;
}
