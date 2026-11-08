/** @jest-environment node */
jest.mock("expo-sqlite", () => ({}));
jest.mock("expo-file-system", () => ({}));
jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
import { DatabaseSync } from "node:sqlite";
import { addBook, getBooks, searchBooks, setRating } from "../db/books";
import { runMigrations } from "../db/migrate";
import migrations from "../drizzle/migrations";
// Verify actual SQL through the synchronous Expo driver against Node SQLite.
import { drizzle as expoDrizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "../db/schema";
import type { Database } from "../db/DrizzleProvider";
test("bounded deterministic reads, literal wildcard search, and centralized validation", async () => {
  const raw = new DatabaseSync(":memory:");
  const adapter: any = {
    execSync: (sql: string) => raw.exec(sql),
    getAllSync: (sql: string, ...params: any[]) =>
      raw.prepare(sql).all(...params),
    runSync: (sql: string, ...params: any[]) => raw.prepare(sql).run(...params),
    prepareSync: (query: string) => {
      const statement = raw.prepare(query);
      return {
        executeForRawResultSync: (params: any[]) => {
          const values = statement
            .all(...params)
            .map((row) => Object.values(row));
          return {
            getAllSync: () => values,
            getFirstSync: () => values[0] ?? null,
          };
        },
        executeSync: (params: any[]) => {
          const normalized = params.map((p) => (p === undefined ? null : p));
          if (/^select/i.test(query)) {
            const values = statement
              .all(...normalized)
              .map((row) => Object.values(row));
            return {
              getAllSync: () => values,
              getFirstSync: () => values[0] ?? null,
              getColumnNames: () => [],
            };
          }
          const result = statement.run(...normalized);
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
          };
        },
      };
    },
  };
  runMigrations(adapter, migrations);
  const db = expoDrizzle(adapter, { schema }) as Database;
  for (let i = 0; i < 85; i++)
    await addBook(db, { title: "Same", author: "Full Author" });
  const first = await getBooks(db),
    second = await getBooks(db, 40);
  expect(first).toHaveLength(40);
  expect(second[0].id).toBeGreaterThan(first[39].id);
  await addBook(db, {
    title: "  100%_literal  ",
    author: "  Full Author  ",
    workKey: "/works/OL1W",
  });
  expect((await searchBooks(db, "%_"))[0].title).toBe("100%_literal");
  expect(await searchBooks(db, "not found")).toHaveLength(0);
  expect(await searchBooks(db, "Same", 8)).toHaveLength(8);
  await expect(addBook(db, { title: " ", author: "A" })).rejects.toThrow();
  await expect(setRating(db, first[0].id, 2.5)).rejects.toThrow();
  raw.close();
});
