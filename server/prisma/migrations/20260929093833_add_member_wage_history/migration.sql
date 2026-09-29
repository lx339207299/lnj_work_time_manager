-- CreateTable
CREATE TABLE `OrganizationMemberWageHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `wageType` VARCHAR(191) NOT NULL,
    `wageAmount` INTEGER NOT NULL,
    `effectiveFrom` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrganizationMemberWageHistory_memberId_effectiveFrom_idx`(`memberId`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrganizationMemberWageHistory` ADD CONSTRAINT `OrganizationMemberWageHistory_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `OrganizationMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: 为存量成员补一条初始工资历史（生效日=成员建档日，保证 ≤ 任何已有工时日期）
INSERT INTO `OrganizationMemberWageHistory` (`memberId`, `wageType`, `wageAmount`, `effectiveFrom`, `createdAt`)
SELECT `id`, `wageType`, `wageAmount`, DATE(`createdAt`), NOW() FROM `OrganizationMember`;
