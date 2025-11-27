PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_authors` (
	`game_id` text NOT NULL,
	`game_version` text NOT NULL,
	`recurse_id` integer,
	`display_name` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_version`) REFERENCES `game_versions`(`version`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_game_authors`("game_id", "game_version", "recurse_id", "display_name") SELECT "game_id", "game_version", "recurse_id", "display_name" FROM `game_authors`;--> statement-breakpoint
DROP TABLE `game_authors`;--> statement-breakpoint
ALTER TABLE `__new_game_authors` RENAME TO `game_authors`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_game_versions` (
	`game_id` text NOT NULL,
	`description` text NOT NULL,
	`visibility` text NOT NULL,
	`version` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_game_versions`("game_id", "description", "visibility", "version") SELECT "game_id", "description", "visibility", "version" FROM `game_versions`;--> statement-breakpoint
DROP TABLE `game_versions`;--> statement-breakpoint
ALTER TABLE `__new_game_versions` RENAME TO `game_versions`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_versions_version_unique` ON `game_versions` (`version`);