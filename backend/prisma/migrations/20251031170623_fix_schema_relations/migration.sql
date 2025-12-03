/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Car` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `make` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerDay` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Booking` DROP COLUMN `date`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `endDate` DATETIME(3) NOT NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Car` DROP COLUMN `brand`,
    DROP COLUMN `price`,
    ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `make` VARCHAR(191) NOT NULL,
    ADD COLUMN `ownerId` INTEGER NOT NULL,
    ADD COLUMN `pricePerDay` DOUBLE NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Car` ADD CONSTRAINT `Car_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Booking` RENAME INDEX `Booking_carId_fkey` TO `Booking_carId_idx`;

-- RenameIndex
ALTER TABLE `Booking` RENAME INDEX `Booking_userId_fkey` TO `Booking_userId_idx`;
