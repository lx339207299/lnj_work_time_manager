/**
 * 临时验证脚本：删除项目接口的权限校验与级联删除。
 * 只读校验 + 测试数据自建自清理。
 * 运行：cd server && npx ts-node --transpile-only scripts/verify-delete-project.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 找到 orgId=1 的组织 owner userId
  const ownerMember = await prisma.organizationMember.findFirst({
    where: { orgId: 1, role: 'owner' },
    select: { userId: true },
  });
  if (!ownerMember) throw new Error('no owner member in org 1');
  const ownerUserId = ownerMember.userId;
  console.log('org1 owner userId:', ownerUserId);

  // 1. 建测试项目 + 各关联数据
  const project = await prisma.project.create({
    data: {
      name: '__verify_delete_test__',
      organization: { connect: { id: 1 } },
      creator: { connect: { id: ownerUserId } },
      projectMembers: { create: { memberId: (await prisma.organizationMember.findFirst({ where: { orgId: 1 } }))!.id, role: 'member' } },
    },
  });
  const member = await prisma.organizationMember.findFirst({ where: { orgId: 1 } });
  const record = await prisma.workRecord.create({
    data: { projectId: project.id, memberId: member!.id, date: '2026-09-30', duration: 2, wageSnapshot: 0, wageTypeSnapshot: 'hour', amount: 0 },
  });
  const flow = await prisma.projectFlow.create({
    data: { projectId: project.id, type: 'income', category: '收款', amount: 100, date: '2026-09-30' },
  });
  await prisma.workSummaryDaily.create({
    data: { orgId: 1, projectId: project.id, memberId: member!.id, date: '2026-09-30', totalDuration: 2, recordCount: 1 },
  });
  console.log('test project created:', project.id);

  // 复现 service.remove 的权限逻辑（与 projects.service.ts 保持一致）
  const remove = async (user: { sub: number; orgId: number; systemRole: string }) => {
    const p = await prisma.project.findUnique({ where: { id: project.id } });
    if (!p) throw new Error('Project not found');
    if (user.systemRole !== 'admin') {
      if (p.orgId !== user.orgId) throw new Error('Forbidden: org mismatch');
      const cm = await prisma.organizationMember.findFirst({ where: { orgId: p.orgId, userId: user.sub } });
      if (!cm || cm.role !== 'owner') throw new Error('Forbidden: only organization owner');
    }
    return prisma.$transaction(async (tx: any) => {
      await tx.workRecord.deleteMany({ where: { projectId: project.id } });
      await tx.projectMember.deleteMany({ where: { projectId: project.id } });
      await tx.projectFlow.deleteMany({ where: { projectId: project.id } });
      await tx.workSummaryDaily.deleteMany({ where: { projectId: project.id } });
      return tx.project.delete({ where: { id: project.id } });
    });
  };

  // 2. 非 owner 成员调用 → 应被拒绝
  const nonOwner = await prisma.organizationMember.findFirst({
    where: { orgId: 1, role: { not: 'owner' } },
    select: { userId: true },
  });
  if (nonOwner) {
    try {
      await remove({ sub: nonOwner.userId, orgId: 1, systemRole: 'user' });
      console.log('[FAIL] non-owner delete was allowed');
    } catch (e: any) {
      console.log('[OK] non-owner rejected:', e.message);
    }
  } else {
    console.log('[SKIP] no non-owner member in org 1');
  }

  // 3. owner 调用 → 成功且级联清理
  await remove({ sub: ownerUserId, orgId: 1, systemRole: 'user' });
  const [p, r, f, s] = await Promise.all([
    prisma.project.findUnique({ where: { id: project.id } }),
    prisma.workRecord.findUnique({ where: { id: record.id } }),
    prisma.projectFlow.findUnique({ where: { id: flow.id } }),
    prisma.workSummaryDaily.findFirst({ where: { projectId: project.id } }),
  ]);
  console.log(
    !p && !r && !f && !s
      ? '[OK] owner delete succeeded, all related rows cascaded'
      : `[FAIL] leftover: project=${!!p} record=${!!r} flow=${!!f} summary=${!!s}`,
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
