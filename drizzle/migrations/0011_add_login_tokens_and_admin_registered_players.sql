-- Create loginTokens table for magic link authentication
CREATE TABLE `loginTokens` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `registrationId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`registrationId`) REFERENCES `playerRegistrations`(`id`) ON DELETE CASCADE
);

-- Create adminRegisteredPlayers table to track admin-registered players
CREATE TABLE `adminRegisteredPlayers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `registrationId` int NOT NULL UNIQUE,
  `passwordSet` boolean DEFAULT false NOT NULL,
  `profileCompleted` boolean DEFAULT false NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`registrationId`) REFERENCES `playerRegistrations`(`id`) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX `idx_loginTokens_token` ON `loginTokens`(`token`);
CREATE INDEX `idx_loginTokens_registrationId` ON `loginTokens`(`registrationId`);
CREATE INDEX `idx_adminRegisteredPlayers_registrationId` ON `adminRegisteredPlayers`(`registrationId`);
