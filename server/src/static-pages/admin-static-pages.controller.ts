import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaticPagesService } from './static-pages.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStaticPageDto, UpdateStaticPageDto, StaticPageQueryDto } from './dto/static-page.dto';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/static-pages')
@Controller('admin/static-pages')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminStaticPagesController {
  constructor(private readonly staticPagesService: StaticPagesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: 静态页面列表' })
  async findAll(@Query() query: StaticPageQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const { list, total } = await this.staticPagesService.findAllForAdmin(page, pageSize, query.keyword);
    return CustomResponse.success(list, undefined, { total, pageSize, currentPage: page });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: 静态页面详情' })
  async findOne(@Param('id') id: string) {
    const page = await this.staticPagesService.findOne(+id);
    if (!page) {
      return CustomResponse.error(1, '页面不存在');
    }
    return CustomResponse.success(page);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: 创建静态页面' })
  async create(@Body() body: CreateStaticPageDto) {
    const page = await this.staticPagesService.create(body);
    return CustomResponse.success(page);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: 更新静态页面' })
  async update(@Param('id') id: string, @Body() body: UpdateStaticPageDto) {
    const page = await this.staticPagesService.update(+id, body);
    return CustomResponse.success(page);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: 删除静态页面' })
  async remove(@Param('id') id: string) {
    await this.staticPagesService.remove(+id);
    return CustomResponse.success(null);
  }
}
