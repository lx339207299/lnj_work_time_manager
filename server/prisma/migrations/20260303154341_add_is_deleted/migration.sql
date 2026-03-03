-- AlterTable
ALTER TABLE `WorkRecord` ADD COLUMN `amount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `WorkSummaryDaily` ADD COLUMN `totalAmount` DOUBLE NOT NULL DEFAULT 0;
