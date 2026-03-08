PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_match` (
	`id` text PRIMARY KEY NOT NULL,
	`competition_id` text NOT NULL,
	`group_id` text,
	`home_team_id` text,
	`away_team_id` text,
	`round` integer DEFAULT 1 NOT NULL,
	`is_knockout` integer DEFAULT false NOT NULL,
	`scheduled_at` integer,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`competition_id`) REFERENCES `competition`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`home_team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`away_team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_match`("id", "competition_id", "group_id", "home_team_id", "away_team_id", "round", "is_knockout", "scheduled_at", "status", "created_at", "updated_at") SELECT "id", "competition_id", "group_id", "home_team_id", "away_team_id", "round", "is_knockout", "scheduled_at", "status", "created_at", "updated_at" FROM `match`;--> statement-breakpoint
DROP TABLE `match`;--> statement-breakpoint
ALTER TABLE `__new_match` RENAME TO `match`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `match_competitionId_idx` ON `match` (`competition_id`);--> statement-breakpoint
CREATE INDEX `match_groupId_idx` ON `match` (`group_id`);--> statement-breakpoint
CREATE INDEX `match_homeTeamId_idx` ON `match` (`home_team_id`);--> statement-breakpoint
CREATE INDEX `match_awayTeamId_idx` ON `match` (`away_team_id`);--> statement-breakpoint
CREATE INDEX `match_status_idx` ON `match` (`status`);