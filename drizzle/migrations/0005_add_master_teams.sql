-- Create masterTeams table for persistent teams across seasons
CREATE TABLE `masterTeams` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `logoUrl` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rename existing teams table to teams_old for backup
ALTER TABLE `teams` RENAME TO `teams_old`;

-- Create new teams table with masterTeamId reference
CREATE TABLE `teams` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `masterTeamId` int NOT NULL,
  `seasonId` int NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`masterTeamId`) REFERENCES `masterTeams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seasonId`) REFERENCES `seasons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the 4 master teams
INSERT INTO `masterTeams` (`name`, `logoUrl`, `createdAt`) VALUES
('Iron Lions', NULL, NOW()),
('Golan Guards', NULL, NOW()),
('H Hammers', NULL, NOW()),
('Schvitz Saints', NULL, NOW());

-- Migrate existing teams from teams_old to new teams table
-- This assumes teams_old has name column that matches one of the 4 master teams
INSERT INTO `teams` (`masterTeamId`, `seasonId`, `createdAt`)
SELECT 
  CASE 
    WHEN t.name = 'Iron Lions' THEN 1
    WHEN t.name = 'Golan Guards' THEN 2
    WHEN t.name = 'H Hammers' THEN 3
    WHEN t.name = 'Schvitz Saints' THEN 4
    ELSE 1
  END as masterTeamId,
  t.seasonId,
  t.createdAt
FROM `teams_old` t
WHERE t.name IN ('Iron Lions', 'Golan Guards', 'H Hammers', 'Schvitz Saints');

-- Drop the old teams table
DROP TABLE `teams_old`;
