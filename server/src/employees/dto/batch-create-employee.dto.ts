import { ApiProperty } from '@nestjs/swagger';

export class BatchCreateEmployeeDto {
  @ApiProperty({
    example: [
      { name: '张三', phone: '13800138000' },
      { name: '李四', phone: '13900139000' },
    ],
    description: 'List of employees to create',
  })
  employees: {
    name: string;
    phone: string;
  }[];

  // @ApiProperty({ example: 1, hidden: true })
  orgId: number;
}
