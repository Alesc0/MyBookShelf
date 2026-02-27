import { eq, like, or } from "drizzle-orm";
import { Book, booksTable } from "./schema";
import { Database } from "./DrizzleProvider";

export async function getBooks(db: Database): Promise<Book[]> {
  return await db.select().from(booksTable);
}

export async function getBookById(db: Database, id: number): Promise<Book | undefined> {
  const rows = await db.select().from(booksTable).where(eq(booksTable.id, id));
  return rows[0];
}

export async function searchBooks(db: Database, query: string): Promise<Book[]> {
  const pattern = `%${query}%`;
  return await db
    .select()
    .from(booksTable)
    .where(
      or(
        like(booksTable.title, pattern),
        like(booksTable.author, pattern)
      )
    );
}

export async function addBook(
  db: Database,
  book: { title: string; author: string; coverUri?: string | null }
): Promise<void> {
  await db.insert(booksTable).values({
    title: book.title,
    author: book.author,
    coverUri: book.coverUri ?? null,
    isRead: 0,
    rating: 0,
  });
}

export async function deleteBook(db: Database, id: number): Promise<void> {
  await db.delete(booksTable).where(eq(booksTable.id, id));
}

export async function toggleRead(db: Database, id: number, isRead: boolean): Promise<void> {
  await db
    .update(booksTable)
    .set({ isRead: isRead ? 1 : 0 })
    .where(eq(booksTable.id, id));
}

export async function setRating(db: Database, id: number, rating: number): Promise<void> {
  await db
    .update(booksTable)
    .set({ rating })
    .where(eq(booksTable.id, id));
}
