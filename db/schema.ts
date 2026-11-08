import { sql } from "drizzle-orm";
import {
  check,
  int,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const booksTable = sqliteTable(
  "books_table",
  {
    id: int().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
    author: text().notNull(),
    coverUri: text(),
    isRead: int().notNull().default(0),
    rating: int().notNull().default(0),
    workKey: text(),
    editionKey: text(),
  },
  (table) => [
    check(
      "books_rating_valid",
      sql`typeof(${table.rating}) = 'integer' and ${table.rating} between 0 and 5`,
    ),
    check("books_read_valid", sql`${table.isRead} in (0, 1)`),
  ],
);

export type Book = typeof booksTable.$inferSelect;

export const users = sqliteTable("users", {
  id: integer(),
});
