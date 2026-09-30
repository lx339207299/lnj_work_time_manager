/**
 * 临时验证脚本：对比 findAll/findOne 新实现与旧实现（全量内存聚合）的结果是否一致。
 * 只做只读查询，使用 .env 指向的本地测试库。
 * 运行：npx ts-node --transpile-only scripts/verify-projects-list.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function oldFindAll(orgId: number) {
  const projects = await prisma.project.findMany({
    where: { orgId },
    include: { projectMembers: true, workRecords: true },
  });
  return projects.map((p: any) => {
    const hoursRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'hour');
    const daysRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'day' || r.wageTypeSnapshot === 'month');
    return {
      id: p.id,
      name: p.name,
      totalHours: hoursRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      totalDaysHours: daysRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
      memberCount: p.projectMembers.length,
    };
  });
}

async function newFindAllAgg(orgId: number, page?: number, pageSize?: number) {
  const [hoursAgg, daysAgg] = await Promise.all([
    prisma.workRecord.groupBy({
      by: ['projectId'],
      where: { project: { orgId }, wageTypeSnapshot: 'hour' },
      _sum: { duration: true },
    }),
    prisma.workRecord.groupBy({
      by: ['projectId'],
      where: { project: { orgId }, wageTypeSnapshot: { in: ['day', 'month'] } },
      _sum: { duration: true },
    }),
  ]);
  const hoursMap = new Map(hoursAgg.map((a: any) => [a.projectId, a._sum.duration ?? 0]));
  const daysMap = new Map(daysAgg.map((a: any) => [a.projectId, a._sum.duration ?? 0]));
  const projects = await prisma.project.findMany({
    where: { orgId },
    orderBy: { id: 'asc' },
    include: { _count: { select: { projectMembers: true } } },
    ...(page !== undefined ? { skip: (page - 1) * pageSize!, take: pageSize } : {}),
  });
  return projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    totalHours: hoursMap.get(p.id) ?? 0,
    totalDaysHours: daysMap.get(p.id) ?? 0,
    memberCount: p._count.projectMembers,
  }));
}

async function oldFindOne(id: number) {
  const p: any = await prisma.project.findUnique({
    where: { id },
    include: { projectMembers: true, workRecords: true },
  });
  if (!p) return null;
  const hoursRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'hour');
  const daysRecords = p.workRecords.filter((r: any) => r.wageTypeSnapshot === 'day' || r.wageTypeSnapshot === 'month');
  return {
    id: p.id,
    totalHours: hoursRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
    totalDaysHours: daysRecords.reduce((sum: number, r: any) => sum + r.duration, 0),
    memberCount: p.projectMembers.length,
  };
}

async function newFindOneAgg(id: number) {
  const p: any = await prisma.project.findUnique({
    where: { id },
    include: { projectMembers: { include: { member: { include: { user: { select: { name: true } } } } } } },
  });
  if (!p) return null;
  const [hoursAgg, daysAgg] = await Promise.all([
    prisma.workRecord.aggregate({ where: { projectId: id, wageTypeSnapshot: 'hour' }, _sum: { duration: true } }),
    prisma.workRecord.aggregate({ where: { projectId: id, wageTypeSnapshot: { in: ['day', 'month'] } }, _sum: { duration: true } }),
  ]);
  return {
    id: p.id,
    totalHours: hoursAgg._sum.duration ?? 0,
    totalDaysHours: daysAgg._sum.duration ?? 0,
    memberCount: p.projectMembers.length,
  };
}

function norm(v: any) {
  return JSON.stringify(v, (_k, val) => (typeof val === 'number' ? Math.round(val * 1000) / 1000 : val));
}

async function main() {
  const orgs = await prisma.project.findMany({ select: { orgId: true }, distinct: ['orgId'], take: 5 });
  let allOk = true;

  for (const { orgId } of orgs) {
    const [o, n] = await Promise.all([oldFindAll(orgId), newFindAllAgg(orgId)]);
    const sortedO = [...o].sort((a, b) => a.id - b.id);
    const sortedN = [...n].sort((a, b) => a.id - b.id);
    const ok = norm(sortedO) === norm(sortedN);
    if (!ok) {
      allOk = false;
      console.log(`[MISMATCH] orgId=${orgId}\n old=${norm(sortedO)}\n new=${norm(sortedN)}`);
    } else {
      console.log(`[OK] findAll orgId=${orgId} projects=${o.length}`);
    }

    // 分页切片等价性：paged 查询结果 === 全量结果按 id 排序后切片
    const full = sortedN;
    const pageSize = Math.max(1, Math.min(20, full.length));
    const paged = await newFindAllAgg(orgId, 2, pageSize);
    const expect = full.slice(pageSize, pageSize * 2);
    const pagedOk = norm(paged) === norm(expect);
    if (!pagedOk) {
      allOk = false;
      console.log(`[MISMATCH] paging orgId=${orgId}\n paged=${norm(paged)}\n expect=${norm(expect)}`);
    } else {
      console.log(`[OK] paging slice orgId=${orgId} page2 size=${pageSize}`);
    }
  }

  const sample = await prisma.project.findMany({ take: 5, orderBy: { id: 'asc' }, select: { id: true } });
  for (const { id } of sample) {
    const [o, n] = await Promise.all([oldFindOne(id), newFindOneAgg(id)]);
    const ok = norm(o) === norm(n);
    if (!ok) {
      allOk = false;
      console.log(`[MISMATCH] projectId=${id}\n old=${norm(o)}\n new=${norm(n)}`);
    } else {
      console.log(`[OK] findOne projectId=${id}`);
    }
  }

  console.log(allOk ? 'ALL MATCH' : 'FOUND MISMATCH');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
