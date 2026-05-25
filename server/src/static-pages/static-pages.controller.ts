import { Controller, Get, Query, Header } from '@nestjs/common';
import { StaticPagesService } from './static-pages.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('pages')
@Controller('pages')
export class StaticPagesController {
  constructor(private readonly staticPagesService: StaticPagesService) {}

  @Get('view')
  @ApiOperation({ summary: '公开接口：获取静态页面 HTML' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async view(@Query('code') code: string) {
    const page = await this.staticPagesService.findByCode(code);
    if (!page) {
      return '<html><body><h1>页面不存在</h1></body></html>';
    }
    return page.content;
  }
}
