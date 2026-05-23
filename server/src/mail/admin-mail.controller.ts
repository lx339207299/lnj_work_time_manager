import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { AuthGuard } from '@nestjs/passport';
import { SystemRolesGuard } from '../auth/system-roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminMailQueryDto, AdminSendMailDto } from './dto/admin-mail.dto';
import { CustomResponse } from '../common/responses/custom.response';

@ApiTags('admin/mail')
@Controller('admin/mail')
@UseGuards(AuthGuard('jwt'), SystemRolesGuard)
@ApiBearerAuth()
export class AdminMailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get email log list' })
  async findAll(@Query() query: AdminMailQueryDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const { list, total } = await this.mailService.findAllForAdmin(page, pageSize, query.keyword);
    
    return CustomResponse.success(list, undefined, {
      total,
      pageSize,
      currentPage: page
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get email log details' })
  async findOne(@Param('id') id: string) {
    const log = await this.mailService.findOne(id);
    if (!log) {
      return CustomResponse.error(1, 'Email log not found');
    }
    return CustomResponse.success(log);
  }

  @Post('send')
  @ApiOperation({ summary: 'Admin: Send an email' })
  async sendMail(@Body() body: AdminSendMailDto) {
    await this.mailService.sendMail(body.to, body.subject, body.html);
    return CustomResponse.success(null);
  }
}
