import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEmployeeItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: '薪资必须大于0' })
  wageAmount: number;

  @IsString()
  @IsOptional()
  wageType?: string;
}

export class BatchCreateEmployeeDto {
  @ApiProperty({
    example: [
      { name: '张三', phone: '13800138000', wageAmount: 100, wageType: 'day' },
      { name: '李四', phone: '13900139000', wageAmount: 120, wageType: 'day' },
    ],
    description: 'List of employees to create',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeItemDto)
  employees: CreateEmployeeItemDto[];

  // @ApiProperty({ example: 1, hidden: true })
  @IsOptional()
  @IsNumber()
  orgId: number;
}
