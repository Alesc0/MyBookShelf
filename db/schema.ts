import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const booksTable = sqliteTable("books_table", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  author: text().notNull(),
  isRead: int().notNull().default(0),
  rating: int().notNull().default(0),
});

export type Book = typeof booksTable.$inferSelect;

export const users = sqliteTable("users", {
  id: integer(),
});
