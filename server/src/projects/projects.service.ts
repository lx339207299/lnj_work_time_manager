
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  findAll(orgId: string) {
    return this.prisma.project.findMany({
      where: { orgId },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }
}
