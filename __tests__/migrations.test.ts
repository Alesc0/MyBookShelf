/** @jest-environment node */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runMigrations } from "../db/migrate";
import migrations from "../drizzle/migrations";
import type { SQLiteDatabase } from "expo-sqlite";
function connection() {
  const raw = new DatabaseSync(":memory:");
  return {
    raw,
    db: {
      execSync: (sql: string) => raw.exec(sql),
      getAllSync: (sql: string, ...params: any[]) =>
        raw.prepare(sql).all(...params),
      getFirstSync: (sql: string, ...params: any[]) =>
        raw.prepare(sql).get(...params),
      runSync: (sql: string, ...params: any[]) =>
        raw.prepare(sql).run(...params),
    } as unknown as SQLiteDatabase,
  };
}
for (const version of [-1, 0, 1])
  test(`fresh/legacy schema ${version}, repeat launch preserves books and tracks migrations`, () => {
    const { raw, db } = connection();
    if (version >= 0) {
      db.execSync(
        readFileSync(
          join(__dirname, "../drizzle/0000_abandoned_edwin_jarvis.sql"),
          "utf8",
        ).replace("--> statement-breakpoint", ""),
      );
      if (version === 1)
        db.execSync(
          readFileSync(
            join(__dirname, "../drizzle/0001_solid_blue_shield.sql"),
            "utf8",
          ),
        );
      db.runSync(
        "INSERT INTO books_table(title, author, rating, isRead) VALUES (?, ?, ?, ?)",
        "Kept",
        "Author",
        4,
        1,
      );
      if (version === 1)
        db.execSync("UPDATE books_table SET coverUri = 'file:///kept.jpg'");
    }
    runMigrations(db, migrations);
    if (version < 0)
      db.execSync(
        "INSERT INTO books_table(title, author) VALUES ('Fresh', 'Author')",
      );
    const before = db.getAllSync("SELECT * FROM books_table");
    expect(before).toHaveLength(1);
    if (version >= 0)
      expect(before[0]).toMatchObject({
        title: "Kept",
        author: "Author",
        rating: 4,
        isRead: 1,
        coverUri: version === 1 ? "file:///kept.jpg" : null,
        workKey: null,
        editionKey: null,
      });
    runMigrations(db, migrations);
    expect(db.getAllSync("SELECT * FROM books_table")).toEqual(before);
    expect(db.getAllSync("SELECT * FROM __bookshelf_migrations")).toHaveLength(
      3,
    );
    expect(() => db.execSync("UPDATE books_table SET rating = 9")).toThrow();
    expect(() => db.execSync("UPDATE books_table SET rating = 2.5")).toThrow();
    expect(() => db.execSync("UPDATE books_table SET isRead = 2")).toThrow();
    raw.close();
  });
test("failed upgrade rolls back data, DDL and ledger; retry applies a data migration only once", () => {
  const { db, raw } = connection();
  runMigrations(db, migrations);
  db.execSync(
    "INSERT INTO books_table(title, author) VALUES ('Kept', 'Author')",
  );
  const entry = { idx: 3, tag: "test" };
  const broken = {
    journal: { entries: [...migrations.journal.entries, entry] },
    migrations: {
      ...migrations.migrations,
      m0003:
        "UPDATE books_table SET rating = 5; --> statement-breakpoint\n INVALID SQL",
    },
  };
  expect(() => runMigrations(db, broken)).toThrow();
  expect(
    db.getFirstSync<{ rating: number }>("SELECT rating FROM books_table")
      ?.rating,
  ).toBe(0);
  expect(db.getAllSync("SELECT * FROM __bookshelf_migrations")).toHaveLength(3);
  broken.migrations.m0003 = "UPDATE books_table SET rating = rating + 1";
  runMigrations(db, broken);
  runMigrations(db, broken);
  expect(
    db.getFirstSync<{ rating: number }>("SELECT rating FROM books_table")
      ?.rating,
  ).toBe(1);
  raw.close();
});

test("invalid historical values roll back the baseline and rebuild without deleting the original row", () => {
  const { db, raw } = connection();
  db.execSync(
    readFileSync(
      join(__dirname, "../drizzle/0000_abandoned_edwin_jarvis.sql"),
      "utf8",
    ).replace("--> statement-breakpoint", ""),
  );
  db.execSync(
    "INSERT INTO books_table(title, author, rating) VALUES ('Keep invalid', 'A', 9)",
  );
  expect(() => runMigrations(db, migrations)).toThrow();
  expect(
    db.getFirstSync<{ title: string; rating: number }>(
      "SELECT title, rating FROM books_table",
    ),
  ).toMatchObject({ title: "Keep invalid", rating: 9 });
  expect(
    db
      .getAllSync<{ name: string }>("PRAGMA table_info(books_table)")
      .map((c) => c.name),
  ).not.toContain("coverUri");
  expect(
    db.getFirstSync(
      "SELECT name FROM sqlite_master WHERE name='__bookshelf_migrations'",
    ),
  ).toBeUndefined();
  raw.close();
});
