
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';

@Injectable()
export class WorkRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkRecordDto: CreateWorkRecordDto) {
    // Get member info for wage snapshot
    const member = await this.prisma.organizationMember.findUnique({
      where: { id: createWorkRecordDto.memberId },
    });

    if (!member) throw new Error('Member not found');

    return this.prisma.workRecord.create({
      data: {
        projectId: createWorkRecordDto.projectId,
        memberId: createWorkRecordDto.memberId,
        date: createWorkRecordDto.date,
        duration: createWorkRecordDto.duration,
        content: createWorkRecordDto.content,
        wageSnapshot: member.wageAmount,
        wageTypeSnapshot: member.wageType,
      },
    });
  }

  findAll(projectId: string, date?: string) {
    const where: any = { projectId };
    if (date) {
        where.date = date;
    }
    return this.prisma.workRecord.findMany({
      where,
      include: {
          member: true
      },
      orderBy: { date: 'desc' }
    });
  }
}
