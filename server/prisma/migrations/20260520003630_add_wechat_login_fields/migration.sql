-- AlterTable
ALTER TABLE `User` MODIFY COLUMN `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `openid` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `unionid` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_openid_key` ON `User`(`openid`);

-- CreateIndex
CREATE UNIQUE INDEX `User_unionid_key` ON `User`(`unionid`);
