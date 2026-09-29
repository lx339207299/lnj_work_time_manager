-- AlterTable
ALTER TABLE `OrganizationMember` MODIFY `wageAmount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ProjectFlow` MODIFY `amount` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `WorkRecord` MODIFY `wageSnapshot` INTEGER NOT NULL,
    MODIFY `amount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `WorkSummaryDaily` MODIFY `totalAmount` INTEGER NOT NULL DEFAULT 0;
