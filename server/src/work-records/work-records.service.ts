
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { CustomResponse } from '../common/responses/custom.response';

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

  async findAll(
    projectId: string, 
    date?: string, 
    month?: string, 
    page: number = 1, 
    pageSize: number = 20
  ) {
    const where: any = { projectId };
    
    if (date) {
        where.date = date;
    } else if (month) {
        // e.g. month="2023-10"
        where.date = {
            startsWith: month
        };
    }

    // If page & pageSize provided, implement pagination
    const skip = (page - 1) * pageSize;
    const take = +pageSize;

    const [list, total] = await Promise.all([
        this.prisma.workRecord.findMany({
            where,
            include: {
                member: {
                    include: {
                        user: true // Get avatar
                    }
                }
            },
            orderBy: { date: 'desc' },
            skip,
            take
        }),
        this.prisma.workRecord.count({ where })
    ]);

    // Map to frontend structure
    const data = list.map(record => ({
        id: record.id,
        projectId: record.projectId,
        userId: record.memberId, // Use memberId as userId reference
        userName: record.member.name,
        userRole: record.member.role,
        avatar: record.member.user?.avatar || '',
        date: record.date,
        duration: record.duration,
        content: record.content
    }));

    // Use CustomResponse to return data and property (pagination info)
    return CustomResponse.success(data, {}, { total, pageSize: +pageSize, currentPage: +page });
  }

  async getStats(projectId: string) {
    // Aggregate total duration by member
    const stats = await this.prisma.workRecord.groupBy({
        by: ['memberId'],
        where: { projectId },
        _sum: {
            duration: true
        }
    });

    // Fetch member details
    const members = await this.prisma.organizationMember.findMany({
        where: {
            id: { in: stats.map(s => s.memberId) }
        },
        include: { user: true }
    });

    return stats.map(s => {
        const member = members.find(m => m.id === s.memberId);
        return {
            userId: s.memberId,
            userName: member?.name || 'Unknown',
            userAvatar: member?.user?.avatar || '',
            userRole: member?.role || 'member',
            totalDuration: s._sum.duration || 0,
            wageType: member?.wageType || 'day'
        };
    });
  }

  async update(id: string, data: any) {
    return this.prisma.workRecord.update({
      where: { id },
      data: {
        duration: data.duration,
        content: data.content,
        date: data.date
      }
    });
  }

  async remove(id: string) {
    return this.prisma.workRecord.delete({
      where: { id }
    });
  }

  async batchCreate(data: { projectId: string, date: string, records: { memberId: string, duration: number }[] }) {
      const { projectId, date, records } = data;
      // Get all members to verify and get snapshots
      const members = await this.prisma.organizationMember.findMany({
          where: {
              id: { in: records.map(r => r.memberId) }
          }
      });

      const operations = records.map(record => {
          const member = members.find(m => m.id === record.memberId);
          if (!member) return null; // Skip invalid members
          
          return this.prisma.workRecord.create({
              data: {
                  projectId,
                  date,
                  memberId: record.memberId,
                  duration: record.duration,
                  content: '', // Default empty for batch
                  wageSnapshot: member.wageAmount,
                  wageTypeSnapshot: member.wageType
              }
          });
      }).filter(op => op !== null);

      // Filter out nulls safely (TS might complain about type)
      const validOps = operations as any[]; 

      return this.prisma.$transaction(validOps);
  }
}
