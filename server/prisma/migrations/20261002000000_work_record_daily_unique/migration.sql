-- 工时记录按天唯一：同一 (projectId, memberId, date) 只保留一条。
-- 步骤：备份重复行 → 去重（每组保留 id 最大一条）→ 全量重算汇总表 → 建唯一索引。

-- 1) 库内备份将被删除的重复行（回滚依据；确认无误后可手动 DROP TABLE）
CREATE TABLE `_bak_work_record_dup_20261002` AS
SELECT wr.*
FROM `WorkRecord` wr
JOIN (
    SELECT `projectId`, `memberId`, `date`, MAX(`id`) AS `keepId`
    FROM `WorkRecord`
    GROUP BY `projectId`, `memberId`, `date`
    HAVING COUNT(*) > 1
) d ON wr.`projectId` = d.`projectId`
   AND wr.`memberId` = d.`memberId`
   AND wr.`date` = d.`date`
   AND wr.`id` < d.`keepId`;

-- 2) 去重：物化普通表存每组 keepId，规避 MySQL「DELETE 同表子查询」限制（5.7/8.0 兼容）
CREATE TABLE `_tmp_wr_keep_20261002` AS
SELECT `projectId`, `memberId`, `date`, MAX(`id`) AS `keepId`
FROM `WorkRecord`
GROUP BY `projectId`, `memberId`, `date`;

DELETE wr FROM `WorkRecord` wr
JOIN `_tmp_wr_keep_20261002` k
  ON wr.`projectId` = k.`projectId`
 AND wr.`memberId` = k.`memberId`
 AND wr.`date` = k.`date`
 AND wr.`id` < k.`keepId`;

DROP TABLE `_tmp_wr_keep_20261002`;

-- 3) 全量重算汇总表（WorkSummaryDaily 完全由明细派生；updatedAt 无库内默认值必须显式给）
DELETE FROM `WorkSummaryDaily`;
INSERT INTO `WorkSummaryDaily`
    (`orgId`, `projectId`, `memberId`, `date`, `totalDuration`, `totalAmount`, `recordCount`, `updatedAt`)
SELECT p.`orgId`, wr.`projectId`, wr.`memberId`, wr.`date`,
       SUM(wr.`duration`), SUM(wr.`amount`), COUNT(*), NOW(3)
FROM `WorkRecord` wr
JOIN `Project` p ON p.`id` = wr.`projectId`
GROUP BY p.`orgId`, wr.`projectId`, wr.`memberId`, wr.`date`;

-- 4) 唯一索引（索引名/列序必须与 Prisma 默认命名及 @@unique 声明一致，否则 migrate dev 判 drift）
CREATE UNIQUE INDEX `WorkRecord_projectId_memberId_date_key`
ON `WorkRecord`(`projectId`, `memberId`, `date`);
