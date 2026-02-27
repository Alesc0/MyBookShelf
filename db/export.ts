import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import {
  StorageAccessFramework,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";

const DB_NAME = "books.db";
const DB_DIR = new Directory(Paths.document, "SQLite");
const DB_FILE = new File(DB_DIR, DB_NAME);

/**
 * Export the SQLite database file.
 * Saves a timestamped copy to the user-chosen directory (defaults to Downloads)
 * via Android's Storage Access Framework.
 */
export async function exportDatabase(): Promise<void> {
  // Stage a cache copy so we can read its bytes
  const cacheDir = new Directory(Paths.cache);
  const stagedFile = new File(cacheDir, DB_NAME);
  if (stagedFile.exists) stagedFile.delete();
  DB_FILE.copy(cacheDir);

  const exportFileName = `MyBookShelf_${new Date().toISOString().replace(/[:.]/g, "-")}.db`;

  // Ask user to pick a directory (defaults to Downloads on Android)
  const permissions =
    await StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted) {
    // Clean up staged file
    if (stagedFile.exists) stagedFile.delete();
    return;
  }

  // Create the target file in the chosen directory
  const safUri = await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    exportFileName,
    "application/x-sqlite3",
  );

  // Read staged DB as base64 and write to SAF destination
  const base64 = await readAsStringAsync(stagedFile.uri, {
    encoding: EncodingType.Base64,
  });
  await StorageAccessFramework.writeAsStringAsync(safUri, base64, {
    encoding: EncodingType.Base64,
  });

  // Clean up staged file
  if (stagedFile.exists) stagedFile.delete();
}

/**
 * Import a database file picked by the user.
 * Replaces the current database.
 * Returns true if a file was selected and imported, false if cancelled.
 */
export async function importDatabase(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled || result.assets.length === 0) {
    return false;
  }

  // Ensure the SQLite directory exists
  if (!DB_DIR.exists) {
    DB_DIR.create({ intermediates: true });
  }

  // Remove old DB so we can replace it
  if (DB_FILE.exists) {
    DB_FILE.delete();
  }

  // Read the picked file as base64 via legacy API (handles content:// URIs)
  // and write it to the DB location
  const base64 = await readAsStringAsync(result.assets[0].uri, {
    encoding: EncodingType.Base64,
  });

  await writeAsStringAsync(DB_FILE.uri, base64, {
    encoding: EncodingType.Base64,
  });

  return true;
}