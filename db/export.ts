import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import {
  Backup,
  bytes,
  decodeBackup,
  restoreDatabase,
  validateDatabase,
} from "./backup";

async function pickOrCancel<T>(pick: () => Promise<T>): Promise<T | null> {
  try {
    return await pick();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ERR_PICKER_CANCELLED" ||
        error.code === "ERR_FILE_PICKING_CANCELLED")
    )
      return null;
    throw error;
  }
}

let busy = false;
async function exclusive<T>(action: () => Promise<T>): Promise<T> {
  if (Platform.OS === "web") throw new Error("Backups require the native app");
  if (busy) throw new Error("Backup already running");
  busy = true;
  try {
    return await action();
  } finally {
    busy = false;
  }
}
export function exportDatabase(
  connection: SQLite.SQLiteDatabase,
): Promise<void> {
  return exclusive(async () => {
    const snapshot = SQLite.openDatabaseSync(":memory:", {
      useNewConnection: true,
    });
    try {
      // Back up to a memory database before serializing, including committed WAL pages.
      SQLite.backupDatabaseSync({
        sourceDatabase: connection,
        destDatabase: snapshot,
      });
      const database = snapshot.serializeSync();
      const covers: Backup["covers"] = [];
      for (const { coverUri } of snapshot.getAllSync<{ coverUri: string }>(
        "SELECT DISTINCT coverUri FROM books_table WHERE coverUri IS NOT NULL",
      )) {
        if (/^https?:/.test(coverUri)) continue;
        // Fail explicitly rather than claim that a backup with missing images is portable.
        covers.push({
          uri: coverUri,
          bytes: Array.from(new File(coverUri).bytesSync()),
        });
      }
      const backup: Backup = {
        format: "MyBookShelf",
        version: 1,
        settings: false,
        database: Array.from(database),
        covers,
      };
      const dir = await pickOrCancel(() => Directory.pickDirectoryAsync());
      if (!dir) return;
      const file = dir.createFile(
        `MyBookShelf_${Date.now()}.bookshelf`,
        "application/json",
      );
      try {
        file.write(JSON.stringify(backup));
      } catch (error) {
        if (file.exists) file.delete();
        throw error;
      }
    } finally {
      snapshot.closeSync();
    }
  });
}
export function importDatabase(
  connection: SQLite.SQLiteDatabase,
  reload: () => void,
): Promise<boolean> {
  return exclusive(async () => {
    const picked = await pickOrCancel(() => File.pickFileAsync());
    if (!picked || (Array.isArray(picked) && !picked.length)) return false;
    const file = Array.isArray(picked) ? picked[0] : picked;
    const decoded = decodeBackup(await file.bytes());
    const staged = SQLite.deserializeDatabaseSync(decoded.database, {
      useNewConnection: true,
    });
    const coverDir = new Directory(
      Paths.document,
      `covers/import-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    let committed = false;
    try {
      validateDatabase(staged);
      coverDir.create({ intermediates: true });
      const importedUris = new Set<string>();
      for (const { uri, bytes: data } of decoded.covers) {
        const target = new File(
          coverDir,
          `${Math.random().toString(36).slice(2)}.jpg`,
        );
        target.write(bytes(data));
        importedUris.add(target.uri);
        staged.runSync(
          "UPDATE books_table SET coverUri = ? WHERE coverUri = ?",
          target.uri,
          uri,
        );
      }
      // A legacy .db cannot carry images. Do not retain device-specific dangling URIs.
      const rows = staged.getAllSync<{ id: number; coverUri: string }>(
        "SELECT id, coverUri FROM books_table WHERE coverUri IS NOT NULL",
      );
      for (const row of rows)
        if (!/^https?:/.test(row.coverUri) && !importedUris.has(row.coverUri))
          staged.runSync(
            "UPDATE books_table SET coverUri = NULL WHERE id = ?",
            row.id,
          );
      const recovery = SQLite.openDatabaseSync("books-recovery.db", {
        useNewConnection: true,
      });
      try {
        // This synchronous section prevents JS reads/writes from interleaving with publication.
        restoreDatabase(connection, staged, recovery);
        committed = true;
      } finally {
        recovery.closeSync();
      }
      reload();
      return true;
    } finally {
      staged.closeSync();
      if (!committed && coverDir.exists) coverDir.delete();
    }
  });
}
