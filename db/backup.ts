import * as SQLite from "expo-sqlite";
import migrations from "../drizzle/migrations";
import { runMigrations } from "./migrate";

export type Backup = {
  format: "MyBookShelf";
  version: 1;
  settings: false;
  database: number[];
  covers: { uri: string; bytes: number[] }[];
};
export function bytes(value: unknown): Uint8Array {
  if (
    !Array.isArray(value) ||
    !value.length ||
    !value.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  )
    throw new Error("Invalid backup bytes");
  return Uint8Array.from(value);
}
export function decodeBackup(data: Uint8Array): {
  database: Uint8Array;
  covers: Backup["covers"];
} {
  if (new TextDecoder().decode(data.slice(0, 16)) === "SQLite format 3\0")
    return { database: data, covers: [] };
  const value = JSON.parse(new TextDecoder().decode(data));
  if (
    value.format !== "MyBookShelf" ||
    value.version !== 1 ||
    !Array.isArray(value.covers)
  )
    throw new Error("Unsupported backup");
  const uris = new Set<string>();
  for (const cover of value.covers) {
    if (typeof cover.uri !== "string" || uris.has(cover.uri))
      throw new Error("Invalid cover");
    bytes(cover.bytes);
    uris.add(cover.uri);
  }
  return { database: bytes(value.database), covers: value.covers };
}
export function validateDatabase(db: SQLite.SQLiteDatabase) {
  const integrity = db.getFirstSync<{ integrity_check: string }>(
    "PRAGMA integrity_check",
  );
  if (integrity?.integrity_check !== "ok") throw new Error("Corrupt library");
  const objects = db.getAllSync<{ type: string; name: string }>(
    "SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'",
  );
  if (
    objects.some(
      (o) =>
        o.type !== "table" ||
        !["books_table", "users", "__bookshelf_migrations"].includes(o.name),
    )
  )
    throw new Error("Unsupported database objects");
  const columns = db
    .getAllSync<{ name: string }>("PRAGMA table_info(books_table)")
    .map((c) => c.name);
  const required = ["id", "title", "author", "isRead", "rating"];
  const allowed = [...required, "coverUri", "workKey", "editionKey"];
  if (
    !required.every((c) => columns.includes(c)) ||
    columns.some((c) => !allowed.includes(c))
  )
    throw new Error("Unsupported schema");
  const ledger = db.getFirstSync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='__bookshelf_migrations'",
  );
  if (ledger) {
    const known = migrations.journal.entries;
    for (const row of db.getAllSync<{ id: number; tag: string }>(
      "SELECT id, tag FROM __bookshelf_migrations",
    )) {
      if (!known.some((e) => e.idx === row.id && e.tag === row.tag))
        throw new Error("Unsupported migration");
    }
  }
  const invalid = db.getFirstSync(
    `SELECT id FROM books_table WHERE typeof(id) != 'integer' OR id <= 0 OR typeof(title) != 'text' OR typeof(author) != 'text' OR typeof(rating) != 'integer' OR rating NOT BETWEEN 0 AND 5 OR typeof(isRead) != 'integer' OR isRead NOT IN (0, 1) LIMIT 1`,
  );
  if (invalid) throw new Error("Invalid book values");
  runMigrations(db, migrations);
}

// SQLite's backup API publishes the complete snapshot atomically. No file deletion,
// rename, connection swap, or WAL copying is involved. A failed backup rolls back.
export function restoreDatabase(
  live: SQLite.SQLiteDatabase,
  staged: SQLite.SQLiteDatabase,
  recovery: SQLite.SQLiteDatabase,
) {
  validateDatabase(staged);
  SQLite.backupDatabaseSync({ sourceDatabase: live, destDatabase: recovery });
  SQLite.backupDatabaseSync({ sourceDatabase: staged, destDatabase: live });
}
