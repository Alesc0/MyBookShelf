CREATE TABLE `__new_books_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`coverUri` text,
	`isRead` integer DEFAULT 0 NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`workKey` text,
	`editionKey` text,
	CONSTRAINT "books_rating_valid" CHECK(typeof("__new_books_table"."rating") = 'integer' and "__new_books_table"."rating" between 0 and 5),
	CONSTRAINT "books_read_valid" CHECK("__new_books_table"."isRead" in (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_books_table`("id", "title", "author", "coverUri", "isRead", "rating", "workKey", "editionKey") SELECT "id", "title", "author", "coverUri", "isRead", "rating", NULL, NULL FROM `books_table`;--> statement-breakpoint
DROP TABLE `books_table`;--> statement-breakpoint
ALTER TABLE `__new_books_table` RENAME TO `books_table`;