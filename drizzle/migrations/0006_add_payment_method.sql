ALTER TABLE `playerRegistrations` ADD COLUMN `paymentMethod` ENUM('eTransfer', 'cash', 'arrangement') NULL AFTER `paymentConfirmed`;
