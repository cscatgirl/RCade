CREATE TABLE `game_authors` (
	`game_id` text NOT NULL,
	`recurse_id` integer,
	`display_name` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text NOT NULL,
	`description` text NOT NULL,
	`visibility` text NOT NULL,
	`version` text NOT NULL,
	`github_author` text NOT NULL,
	`github_repo` text NOT NULL,
	`owner_rc_id` numeric NOT NULL
);
