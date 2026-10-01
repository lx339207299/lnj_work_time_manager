-- 新增组织级收支台账：工资发放、设备添置等发生在组织层（非项目层）的流水
-- 纯新增表，无存量数据变更

CREATE TABLE `OrganizationFlow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orgId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `relatedMemberId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationFlow_orgId_date_idx`(`orgId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrganizationFlow` ADD CONSTRAINT `OrganizationFlow_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationFlow` ADD CONSTRAINT `OrganizationFlow_relatedMemberId_fkey` FOREIGN KEY (`relatedMemberId`) REFERENCES `OrganizationMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
