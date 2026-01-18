CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int,
	`alertType` enum('bias_critical','performance_threshold','cognitive_drift','deadline_risk','team_health') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`alertSeverity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`isRead` boolean DEFAULT false,
	`isDismissed` boolean DEFAULT false,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audio_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`duration` int,
	`transcription` text,
	`transcriptionStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`analysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audio_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bias_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`biasCategory` enum('confirmation','groupthink','sunk_cost','overconfidence','authority','anchoring','halo_effect','availability','bandwagon') NOT NULL,
	`description` text,
	`indicators` json,
	`mitigationStrategies` json,
	`detectionPatterns` json,
	`patternSeverity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bias_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cognitive_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`eventType` enum('bias_detected','convergence_warning','diversity_alert','decision_quality_change','pattern_recognized','intervention_triggered','milestone_reached') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`description` text,
	`data` json,
	`sourceMessageId` int,
	`sourceDecisionId` int,
	`acknowledged` boolean DEFAULT false,
	`acknowledgedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cognitive_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cognitive_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`teamId` int,
	`memoryType` enum('decision_outcome','error_pattern','success_pattern','strategy','lesson_learned') NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`context` text,
	`tags` json,
	`embedding` json,
	`outcomeType` enum('success','failure','neutral','pending') DEFAULT 'pending',
	`impactScore` float,
	`usageCount` int DEFAULT 0,
	`isGlobal` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cognitive_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cognitive_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`diversityIndex` float,
	`criticalThinkingScore` float,
	`convergenceRate` float,
	`biasRiskLevel` float,
	`decisionQuality` float,
	`engagementLevel` float,
	`explorationVsExecution` float,
	`consensusLevel` float,
	CONSTRAINT `cognitive_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`decisionType` enum('strategic','tactical','operational','technical') NOT NULL DEFAULT 'tactical',
	`decisionStatus` enum('proposed','discussing','voting','decided','implemented','revised') NOT NULL DEFAULT 'proposed',
	`outcome` text,
	`rationale` text,
	`alternatives` json,
	`proposedBy` int NOT NULL,
	`decidedAt` timestamp,
	`impactScore` float,
	`confidenceLevel` float,
	`biasesDetected` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`docType` enum('document','diagram','prototype','image','other') NOT NULL DEFAULT 'document',
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`size` int,
	`version` int NOT NULL DEFAULT 1,
	`parentId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int,
	`content` text NOT NULL,
	`messageType` enum('user','system','ai_insight','bias_alert','smart_ping','audio','document') NOT NULL DEFAULT 'user',
	`metadata` json,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('planning','active','review','completed','archived') NOT NULL DEFAULT 'planning',
	`startDate` timestamp,
	`endDate` timestamp,
	`goals` json,
	`cognitiveHealth` json,
	`cognitiveTokens` int NOT NULL DEFAULT 0,
	`lastPingCT` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realtime_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`messageId` int,
	`audioId` int,
	`analysisType` enum('sentiment','cognitive','psychological','bias') NOT NULL,
	`result` json NOT NULL,
	`processingTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `realtime_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`taskStatus` enum('todo','in_progress','review','completed','blocked') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`assigneeId` int,
	`dueDate` timestamp,
	`relatedDecisionId` int,
	`cognitiveLoad` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`email` varchar(320),
	`inviteCode` varchar(64) NOT NULL,
	`inviteRole` enum('admin','member') NOT NULL DEFAULT 'member',
	`inviteStatus` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedByUserId` int,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_invitations_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int NOT NULL,
	`avatarUrl` text,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionId` int NOT NULL,
	`userId` int NOT NULL,
	`choice` varchar(255) NOT NULL,
	`reasoning` text,
	`confidence` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `expertise` json;--> statement-breakpoint
ALTER TABLE `users` ADD `cognitiveProfile` json;