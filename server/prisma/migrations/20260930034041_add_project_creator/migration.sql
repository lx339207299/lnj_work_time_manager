-- AlterTable
ALTER TABLE `Project` ADD COLUMN `creatorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: 存量项目创建者不可追溯，回填为组织 owner
UPDATE `Project` p
JOIN `Organization` o ON p.`orgId` = o.`id`
SET p.`creatorId` = o.`ownerId`
WHERE p.`creatorId` IS NULL;
