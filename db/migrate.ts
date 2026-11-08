import type { SQLiteDatabase } from "expo-sqlite";

type Bundle = {
  journal: { entries: { idx: number; tag: string }[] };
  migrations: Record<string, string>;
};

// Only the two shipped, ledger-free schemas can be baselined. All later SQL runs once.
export function runMigrations(db: SQLiteDatabase, bundle: Bundle) {
  db.execSync("BEGIN IMMEDIATE");
  try {
    db.execSync(
      "CREATE TABLE IF NOT EXISTS __bookshelf_migrations (id INTEGER PRIMARY KEY, tag TEXT NOT NULL)",
    );
    const applied = new Set(
      db
        .getAllSync<{ id: number }>("SELECT id FROM __bookshelf_migrations")
        .map((r) => r.id),
    );
    const columns = db
      .getAllSync<{ name: string }>("PRAGMA table_info(books_table)")
      .map((r) => r.name);
    if (!applied.size && columns.length) {
      if (
        !["id", "title", "author", "isRead", "rating"].every((c) =>
          columns.includes(c),
        )
      )
        throw new Error("Unsupported library schema");
      db.execSync("CREATE TABLE IF NOT EXISTS users (id integer)");
      for (const idx of columns.includes("coverUri") ? [0, 1] : [0]) {
        const entry = bundle.journal.entries.find((e) => e.idx === idx)!;
        db.runSync(
          "INSERT INTO __bookshelf_migrations (id, tag) VALUES (?, ?)",
          idx,
          entry.tag,
        );
        applied.add(idx);
      }
    }
    for (const entry of bundle.journal.entries) {
      if (applied.has(entry.idx)) continue;
      const sql = bundle.migrations[`m${String(entry.idx).padStart(4, "0")}`];
      if (!sql) throw new Error(`Missing migration: ${entry.tag}`);
      for (const stmt of sql.split("--> statement-breakpoint"))
        if (stmt.trim()) db.execSync(stmt);
      db.runSync(
        "INSERT INTO __bookshelf_migrations (id, tag) VALUES (?, ?)",
        entry.idx,
        entry.tag,
      );
    }
    db.execSync("COMMIT");
  } catch (error) {
    db.execSync("ROLLBACK");
    throw error;
  }
}
