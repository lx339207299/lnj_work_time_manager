import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  // @ApiProperty({ example: 'uuid-org-id', hidden: true })
  orgId: number;

  @ApiProperty({ example: '13900139000' })
  phone: string;

  @ApiProperty({ example: 'member', required: false })
  role?: string;

  @ApiProperty({ example: 'day', required: false })
  wageType?: string;

  @ApiProperty({ example: 100, required: false })
  wageAmount?: number;
}
