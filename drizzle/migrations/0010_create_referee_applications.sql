CREATE TABLE `refereeApplications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `interacEmail` varchar(320) NOT NULL,
  `role` enum('referee', 'scorekeeper') NOT NULL,
  `isCertified` boolean NOT NULL DEFAULT false,
  `certifications` json,
  `yearsOfExperience` int NOT NULL,
  `hockeyLevels` json,
  `status` enum('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `approvalDate` timestamp NULL,
  `paymentAmount` decimal(10, 2),
  `selectedGames` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
