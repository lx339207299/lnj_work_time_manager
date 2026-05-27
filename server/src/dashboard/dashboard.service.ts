import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /** 总览统计 */
  async getOverview() {
    const [
      totalUsers,
      totalOrgs,
      activeOrgs,
      totalProjects,
      activeProjects,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,
      todayWorkHours,
      weekWorkHours,
      monthWorkHours,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count({ where: { isDeleted: false } }),
      this.prisma.organization.count(),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'active' } }),
      this.prisma.user.count({
        where: { createdAt: { gte: todayStart() } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: daysAgo(7) } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: daysAgo(30) } },
      }),
      this.prisma.workRecord.aggregate({
        where: { date: todayStr() },
        _sum: { duration: true },
      }),
      this.prisma.workRecord.aggregate({
        where: { date: { gte: daysAgoStr(7) } },
        _sum: { duration: true },
      }),
      this.prisma.workRecord.aggregate({
        where: { date: { gte: daysAgoStr(30) } },
        _sum: { duration: true },
      }),
    ]);

    return {
      totalUsers,
      totalOrgs,
      activeOrgs,
      totalProjects,
      activeProjects,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,
      todayWorkHours: todayWorkHours._sum.duration || 0,
      weekWorkHours: weekWorkHours._sum.duration || 0,
      monthWorkHours: monthWorkHours._sum.duration || 0,
    };
  }

  /** 用户增长趋势（近30天按天） */
  async getUserTrend(days: number = 30) {
    const startDate = daysAgo(days);
    
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // 按天聚合
    const trend: { date: string; count: number; total: number }[] = [];
    const all = await this.prisma.user.count();
    const beforeCount = all - users.length;

    // 生成每天的数据
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = users.filter(u =>
        u.createdAt.toISOString().slice(0, 10) === dateStr
      ).length;
      
      const lastTotal = trend.length > 0 ? trend[trend.length - 1].total : beforeCount;
      trend.push({ date: dateStr, count, total: lastTotal + count });
    }

    return trend;
  }

  /** 工时趋势（近30天按天） */
  async getWorkHourTrend(days: number = 30) {
    const startStr = daysAgoStr(days);

    const records = await this.prisma.workRecord.groupBy({
      by: ['date'],
      where: { date: { gte: startStr } },
      _sum: { duration: true },
      orderBy: { date: 'asc' },
    });

    return records.map(r => ({
      date: r.date,
      hours: r._sum.duration || 0,
    }));
  }

  /** 组织工时排行 Top N */
  async getOrgRanking(limit: number = 10) {
    const records = await this.prisma.workRecord.groupBy({
      by: ['projectId'],
      _sum: { duration: true },
      orderBy: { _sum: { duration: 'desc' } },
      take: 50,
    });

    // 找出这些 project 的 orgId
    const projectIds = records.map(r => r.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, orgId: true, organization: { select: { name: true } } },
    });

    // 按 org 聚合
    const orgMap = new Map<number, { name: string; hours: number }>();
    for (const record of records) {
      const proj = projects.find(p => p.id === record.projectId);
      if (!proj) continue;
      const org = orgMap.get(proj.orgId) || { name: proj.organization.name, hours: 0 };
      org.hours += record._sum.duration || 0;
      orgMap.set(proj.orgId, org);
    }

    return Array.from(orgMap.entries())
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, limit)
      .map(([orgId, val]) => ({ orgId, orgName: val.name, totalHours: Math.round(val.hours * 10) / 10 }));
  }
}

// Helpers
function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = todayStart();
  d.setDate(d.getDate() - n);
  return d;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
