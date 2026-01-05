import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { booksTable, users } from "./schema";

const expoDb = SQLite.openDatabaseSync("books.db");
const db = drizzle(expoDb);

export async function addBook() {
  return await db.insert(booksTable).values({
    title: "New Book",
    author: "Unknown Author",
    isRead: 0,
    rating: 0,
  });
}
