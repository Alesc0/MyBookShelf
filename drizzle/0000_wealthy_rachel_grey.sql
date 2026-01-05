CREATE TABLE `books_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`isRead` integer DEFAULT 0 NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL
);
