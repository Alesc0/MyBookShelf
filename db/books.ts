import { asc, eq, or, sql } from "drizzle-orm";
import { Book, booksTable } from "./schema";
import type { Database } from "./DrizzleProvider";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export const LIBRARY_PAGE_SIZE = 40;
export function getBooks(db: Database, offset = 0): Promise<Book[]> {
  return Promise.resolve(
    db
      .select()
      .from(booksTable)
      .orderBy(asc(booksTable.title), asc(booksTable.id))
      .limit(LIBRARY_PAGE_SIZE)
      .offset(offset)
      .all(),
  );
}
export async function getBookById(db: Database, id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid book ID");
  return db.select().from(booksTable).where(eq(booksTable.id, id)).get();
}
export async function searchBooks(
  db: Database,
  query: string,
  limit = LIBRARY_PAGE_SIZE,
  offset = 0,
): Promise<Book[]> {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  return db
    .select()
    .from(booksTable)
    .where(
      or(
        sql`${booksTable.title} LIKE ${pattern} ESCAPE '\\'`,
        sql`${booksTable.author} LIKE ${pattern} ESCAPE '\\'`,
      ),
    )
    .orderBy(asc(booksTable.title), asc(booksTable.id))
    .limit(limit)
    .offset(offset)
    .all();
}
export async function addBook(
  db: Database,
  book: {
    title: string;
    author: string;
    coverUri?: string | null;
    workKey?: string | null;
    editionKey?: string | null;
  },
): Promise<void> {
  const title = book.title.trim(),
    author = book.author.trim();
  if (!title || !author) throw new Error("Title and author are required");
  let coverUri = book.coverUri ?? null;
  let copied: File | undefined;
  try {
    if (coverUri && !/^https?:/.test(coverUri) && Platform.OS !== "web") {
      const dir = new Directory(Paths.document, "covers");
      dir.create({ intermediates: true, idempotent: true });
      copied = new File(
        dir,
        `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      );
      new File(coverUri).copy(copied);
      coverUri = copied.uri;
    }
    // Separate copies and editions are deliberately allowed, even with the same catalog key.
    db.insert(booksTable)
      .values({ ...book, title, author, coverUri, isRead: 0, rating: 0 })
      .run();
  } catch (error) {
    if (copied?.exists) copied.delete();
    throw error;
  }
}
export async function deleteBook(db: Database, id: number) {
  db.delete(booksTable).where(eq(booksTable.id, id)).run();
}
export async function toggleRead(db: Database, id: number, isRead: boolean) {
  db.update(booksTable)
    .set({ isRead: isRead ? 1 : 0 })
    .where(eq(booksTable.id, id))
    .run();
}
export async function setRating(db: Database, id: number, rating: number) {
  if (!Number.isInteger(rating) || rating < 0 || rating > 5)
    throw new Error("Invalid rating");
  db.update(booksTable).set({ rating }).where(eq(booksTable.id, id)).run();
}
