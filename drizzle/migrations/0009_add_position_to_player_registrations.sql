-- Add position column to playerRegistrations table
ALTER TABLE `playerRegistrations` ADD COLUMN `position` ENUM('forward', 'defense', 'goalie') DEFAULT NULL;
