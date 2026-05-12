-- Player Availability
CREATE TABLE IF NOT EXISTS `playerAvailability` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `playerTeamId` int NOT NULL,
  `gameId` int NOT NULL,
  `isAvailable` boolean NOT NULL DEFAULT true,
  `reason` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `playerAvailability_playerTeamId_gameId_unique` (`playerTeamId`, `gameId`)
);

-- Staff Game Assignments
CREATE TABLE IF NOT EXISTS `staffGameAssignments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `refereeApplicationId` int NOT NULL,
  `gameId` int NOT NULL,
  `role` enum('referee','scorekeeper') NOT NULL,
  `status` enum('assigned','confirmed','declined','completed') NOT NULL DEFAULT 'assigned',
  `paymentAmount` decimal(10,2),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `staffGameAssignments_refereeApplicationId_gameId_unique` (`refereeApplicationId`, `gameId`)
);

-- Staff Payments
CREATE TABLE IF NOT EXISTS `staffPayments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `refereeApplicationId` int NOT NULL,
  `gameId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `paidDate` timestamp,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `recipientId` int NOT NULL,
  `recipientType` enum('user','player','staff') NOT NULL,
  `type` enum('game_assignment','availability_change','payment','approval','rejection') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `relatedId` int,
  `isRead` boolean NOT NULL DEFAULT false,
  `emailSent` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `notifications_recipientId_index` (`recipientId`)
);
