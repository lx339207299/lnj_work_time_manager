import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaticPageDto, UpdateStaticPageDto } from './dto/static-page.dto';

@Injectable()
export class StaticPagesService {
  constructor(private prisma: PrismaService) {}

  async findByCode(code: string) {
    return this.prisma.staticPage.findUnique({ where: { code } });
  }

  async findAllForAdmin(page: number, pageSize: number, keyword?: string) {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { remark: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.staticPage.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.staticPage.count({ where }),
    ]);

    return { list, total };
  }

  async findOne(id: number) {
    return this.prisma.staticPage.findUnique({ where: { id } });
  }

  async create(dto: CreateStaticPageDto) {
    const existing = await this.prisma.staticPage.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException('页面标识 (code) 已存在');
    }
    return this.prisma.staticPage.create({ data: dto });
  }

  async update(id: number, dto: UpdateStaticPageDto) {
    if (dto.code) {
      const existing = await this.prisma.staticPage.findUnique({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('页面标识 (code) 已存在');
      }
    }
    return this.prisma.staticPage.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.staticPage.delete({ where: { id } });
  }
}
