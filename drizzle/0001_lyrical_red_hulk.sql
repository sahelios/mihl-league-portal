CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`authorId` int,
	`seasonId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameVenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameVenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seasonId` int NOT NULL,
	`homeTeamId` int NOT NULL,
	`awayTeamId` int NOT NULL,
	`venueId` int NOT NULL,
	`gameDate` date NOT NULL,
	`gameTime` varchar(10) NOT NULL,
	`homeScore` int,
	`awayScore` int,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromAdminId` int NOT NULL,
	`toPlayerTeamId` int,
	`toTeamId` int,
	`subject` varchar(200),
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`authorId` int,
	`seasonId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerRegistrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`teamId` int NOT NULL,
	`seasonId` int NOT NULL,
	`isFirstTime` boolean NOT NULL DEFAULT false,
	`registrationType` enum('individual','team') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`paymentConfirmed` boolean NOT NULL DEFAULT false,
	`jerseyOrderConfirmed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerRegistrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerTeamId` int NOT NULL,
	`seasonId` int NOT NULL,
	`goals` int NOT NULL DEFAULT 0,
	`assists` int NOT NULL DEFAULT 0,
	`points` int NOT NULL DEFAULT 0,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`registrationId` int,
	`teamId` int NOT NULL,
	`seasonId` int NOT NULL,
	`jerseyNumber` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playerTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `starsOfWeek` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerTeamId` int,
	`playerName` varchar(100),
	`teamId` int,
	`seasonId` int,
	`weekNumber` int NOT NULL,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `starsOfWeek_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suspensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerTeamId` int,
	`playerName` varchar(100),
	`teamId` int,
	`seasonId` int,
	`reason` text,
	`startDate` date NOT NULL,
	`endDate` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suspensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`seasonId` int NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`ties` int NOT NULL DEFAULT 0,
	`points` int NOT NULL DEFAULT 0,
	`goalsFor` int NOT NULL DEFAULT 0,
	`goalsAgainst` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`logoUrl` text,
	`seasonId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
