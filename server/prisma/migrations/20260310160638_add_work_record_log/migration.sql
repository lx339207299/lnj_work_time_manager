-- CreateTable
CREATE TABLE `WorkRecordLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orgId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `workRecordId` INTEGER NOT NULL,
    `operatorId` INTEGER NOT NULL,
    `targetMemberId` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `oldData` TEXT NULL,
    `newData` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkRecordLog_orgId_date_idx`(`orgId`, `date`),
    INDEX `WorkRecordLog_projectId_date_idx`(`projectId`, `date`),
    INDEX `WorkRecordLog_operatorId_idx`(`operatorId`),
    INDEX `WorkRecordLog_workRecordId_idx`(`workRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkRecordLog` ADD CONSTRAINT `WorkRecordLog_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
