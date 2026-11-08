/** @jest-environment node */
jest.mock("expo-sqlite", () => ({ backupDatabaseSync: jest.fn() }));
import * as SQLite from "expo-sqlite";
import { DatabaseSync } from "node:sqlite";
import {
  bytes,
  decodeBackup,
  restoreDatabase,
  validateDatabase,
} from "../db/backup";
import { runMigrations } from "../db/migrate";
import migrations from "../drizzle/migrations";
function staged() {
  const raw = new DatabaseSync(":memory:");
  const db = {
    execSync: (sql: string) => raw.exec(sql),
    getAllSync: (sql: string, ...params: any[]) =>
      raw.prepare(sql).all(...params),
    getFirstSync: (sql: string, ...params: any[]) =>
      raw.prepare(sql).get(...params),
    runSync: (sql: string, ...params: any[]) => raw.prepare(sql).run(...params),
  } as unknown as SQLite.SQLiteDatabase;
  return { raw, db };
}
afterEach(() => jest.clearAllMocks());
test("invalid database is rejected before recovery or replacement is attempted", () => {
  const { raw, db } = staged();
  expect(() => restoreDatabase({} as any, db, {} as any)).toThrow(
    "Unsupported schema",
  );
  expect(SQLite.backupDatabaseSync).not.toHaveBeenCalled();
  raw.close();
});
test("future schema and migration versions are rejected", () => {
  const { raw, db } = staged();
  runMigrations(db, migrations);
  db.execSync("INSERT INTO __bookshelf_migrations VALUES(999, 'future')");
  expect(() => validateDatabase(db)).toThrow("Unsupported migration");
  raw.close();
});
test("recovery completes before publication, and a failed recovery never touches the live destination", () => {
  const { raw, db } = staged();
  runMigrations(db, migrations);
  const live = {} as SQLite.SQLiteDatabase,
    recovery = {} as SQLite.SQLiteDatabase;
  const backup = jest.mocked(SQLite.backupDatabaseSync);
  backup.mockImplementationOnce(() => {
    throw new Error("disk full");
  });
  expect(() => restoreDatabase(live, db, recovery)).toThrow("disk full");
  expect(backup).toHaveBeenCalledTimes(1);
  expect(backup).toHaveBeenCalledWith({
    sourceDatabase: live,
    destDatabase: recovery,
  });
  backup.mockClear();
  backup.mockImplementation(() => {});
  restoreDatabase(live, db, recovery);
  expect(backup.mock.calls).toEqual([
    [{ sourceDatabase: live, destDatabase: recovery }],
    [{ sourceDatabase: db, destDatabase: live }],
  ]);
  raw.close();
});
test("backup format round trips covers and rejects unsupported versions and corrupt bytes", () => {
  const value = {
    format: "MyBookShelf",
    version: 1,
    settings: false,
    database: [1, 2, 3],
    covers: [{ uri: "file:///other-device.jpg", bytes: [255, 0, 127] }],
  };
  const decoded = decodeBackup(new TextEncoder().encode(JSON.stringify(value)));
  expect([...decoded.database]).toEqual([1, 2, 3]);
  expect([...bytes(decoded.covers[0].bytes)]).toEqual([255, 0, 127]);
  expect(() =>
    decodeBackup(
      new TextEncoder().encode(JSON.stringify({ ...value, version: 2 })),
    ),
  ).toThrow();
  expect(() => bytes([-1, 256])).toThrow();
  expect(() =>
    decodeBackup(new TextEncoder().encode("not a backup")),
  ).toThrow();
});
