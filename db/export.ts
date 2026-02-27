import { Directory, File, Paths } from "expo-file-system";

const DB_NAME = "books.db";
const DB_DIR = new Directory(Paths.document, "SQLite");
const DB_FILE = new File(DB_DIR, DB_NAME);

/**
 * Export the SQLite database file.
 * Lets the user pick a destination directory, then copies the DB there
 * with a timestamped filename.
 */
export async function exportDatabase(): Promise<void> {
  // Stage a cache copy so we can read its bytes
  const cacheDir = new Directory(Paths.cache);
  const stagedFile = new File(cacheDir, DB_NAME);
  if (stagedFile.exists) stagedFile.delete();
  DB_FILE.copy(cacheDir);

  const exportFileName = `MyBookShelf_${new Date().toISOString().replace(/[:.]/g, "-")}.db`;

  // Let the user pick a destination directory
  const pickedDir = await Directory.pickDirectoryAsync();

  // Create the target file in the chosen directory and write the DB bytes
  const destFile = pickedDir.createFile(
    exportFileName,
    "application/x-sqlite3",
  );
  const data = await stagedFile.base64();
  destFile.write(data, { encoding: "base64" });

  // Clean up staged file
  if (stagedFile.exists) stagedFile.delete();
}

/**
 * Import a database file picked by the user.
 * Replaces the current database.
 * Returns true if a file was selected and imported, false if cancelled.
 */
export async function importDatabase(): Promise<boolean> {
  const pickedFile = await File.pickFileAsync(
    undefined,
    "application/octet-stream",
  );

  // pickFileAsync returns a single File (or array); handle cancellation
  if (!pickedFile) {
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

  // Read picked file as base64 and write to the DB location
  const picked = Array.isArray(pickedFile) ? pickedFile[0] : pickedFile;
  const data = await picked.base64();
  DB_FILE.create();
  DB_FILE.write(data, { encoding: "base64" });

  return true;
}
