import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaticPageDto {
  @ApiPropertyOptional({ description: '标题' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '唯一标识' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'HTML 内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '管理员备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateStaticPageDto {
  @ApiPropertyOptional({ description: '标题' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '唯一标识' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'HTML 内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '管理员备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class StaticPageQueryDto {
  @ApiPropertyOptional({ description: '当前页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '关键词搜索（code/备注）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
