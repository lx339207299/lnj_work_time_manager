import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 发送邮件
   * @param to 收件人邮箱
   * @param subject 邮件主题
   * @param html HTML格式内容
   */
  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"Work Time Manager" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}, MessageId: ${info.messageId}`);
      
      // 记录发送成功
      await this.prisma.emailLog.create({
        data: {
          to,
          subject,
          content: html,
          status: 0, // 0表示成功
        },
      });

      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      
      // 记录发送失败
      await this.prisma.emailLog.create({
        data: {
          to,
          subject,
          content: html,
          status: 1, // 1表示失败
          errorMsg: error instanceof Error ? error.message : JSON.stringify(error),
        },
      });

      throw error;
    }
  }

  async findAllForAdmin(page: number, pageSize: number, keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { to: { contains: keyword } },
        { subject: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return { list, total };
  }

  async findOne(id: string) {
    return this.prisma.emailLog.findUnique({
      where: { id },
    });
  }
}
