-- 月薪下线：存量月薪成员（含工资历史）统一改为日薪。
-- 换算规则：日薪 = 月薪 / 21.75，四舍五入到分（与后端 calculateAmount 的 month 折算口径一致）。
-- 历史工时记录为快照制（wageSnapshot/wageTypeSnapshot），不受本次变更影响。

-- 库内备份（回滚依据；确认无误后可手动 DROP TABLE）
CREATE TABLE `_bak_member_month_wage_20260930` AS
SELECT `id` AS `member_id`, `wageType` AS `old_wage_type`, `wageAmount` AS `old_wage_amount`
FROM `OrganizationMember`
WHERE `wageType` = 'month';

CREATE TABLE `_bak_wage_history_month_20260930` AS
SELECT `id`, `wageType` AS `old_wage_type`, `wageAmount` AS `old_wage_amount`
FROM `OrganizationMemberWageHistory`
WHERE `wageType` = 'month';

-- 工资历史同步换算（金额计算优先取历史行 getWageAt，必须与成员表一致）
UPDATE `OrganizationMemberWageHistory`
SET `wageType` = 'day',
    `wageAmount` = ROUND(`wageAmount` / 21.75)
WHERE `wageType` = 'month';

-- 成员表现值换算
UPDATE `OrganizationMember`
SET `wageType` = 'day',
    `wageAmount` = ROUND(`wageAmount` / 21.75)
WHERE `wageType` = 'month';
