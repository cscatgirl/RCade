PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_authors` (
	`game_id` text NOT NULL,
	`recurse_id` integer,
	`display_name` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_authors`("game_id", "recurse_id", "display_name") SELECT "game_id", "recurse_id", "display_name" FROM `game_authors`;--> statement-breakpoint
DROP TABLE `game_authors`;--> statement-breakpoint
ALTER TABLE `__new_game_authors` RENAME TO `game_authors`;--> statement-breakpoint
PRAGMA foreign_keys=ON;