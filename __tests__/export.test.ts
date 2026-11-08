/** @jest-environment node */
const mockState: any = {
  files: new Map(),
  directories: new Set(),
  picked: null,
  writeError: false,
};
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));
jest.mock("expo-file-system", () => {
  class Directory {
    uri: string;
    constructor(...parts: any[]) {
      this.uri =
        parts
          .map((p) => p.uri ?? p)
          .join("/")
          .replace(/\/+$/, "") + "/";
    }
    static async pickDirectoryAsync() {
      if (mockState.directoryError) throw mockState.directoryError;
      return mockState.destination;
    }
    get exists() {
      return mockState.directories.has(this.uri);
    }
    create() {
      mockState.directories.add(this.uri);
    }
    delete() {
      mockState.directories.delete(this.uri);
    }
    createFile(name: string) {
      return new File(this, name);
    }
  }
  class File {
    uri: string;
    constructor(...parts: any[]) {
      this.uri = parts.map((p) => p.uri ?? p).join("/");
    }
    static async pickFileAsync() {
      if (mockState.pickerError) throw mockState.pickerError;
      return mockState.picked;
    }
    get exists() {
      return mockState.files.has(this.uri);
    }
    write(data: any) {
      if (mockState.writeError) throw new Error("write failed");
      mockState.files.set(this.uri, data);
    }
    bytesSync() {
      if (!this.exists) throw new Error("missing image");
      return mockState.files.get(this.uri);
    }
    delete() {
      mockState.files.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: "file:///new-device" } };
});
jest.mock("expo-sqlite", () => ({
  deserializeDatabaseSync: jest.fn(),
  openDatabaseSync: jest.fn(),
  backupDatabaseSync: jest.fn(),
}));
import * as SQLite from "expo-sqlite";
import { exportDatabase, importDatabase } from "../db/export";
import { Directory } from "expo-file-system";
import migrations from "../drizzle/migrations";
const live = {} as SQLite.SQLiteDatabase;
let staged: any, reload: jest.Mock;
function backup() {
  return new TextEncoder().encode(
    JSON.stringify({
      format: "MyBookShelf",
      version: 1,
      settings: false,
      database: [1, 2],
      covers: [{ uri: "file:///old-device/cover.jpg", bytes: [3, 4, 5] }],
    }),
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockState.files.clear();
  mockState.directories.clear();
  mockState.writeError = false;
  mockState.pickerError = undefined;
  mockState.directoryError = undefined;
  mockState.picked = { bytes: async () => backup() };
  mockState.destination = new Directory("file:///exports");
  reload = jest.fn();
  staged = {
    rows: [{ id: 1, coverUri: "file:///old-device/cover.jpg" }],
    closeSync: jest.fn(),
    execSync: jest.fn(),
    serializeSync: () => new Uint8Array([1, 2]),
    getFirstSync: jest.fn((sql: string) =>
      sql.includes("integrity_check")
        ? { integrity_check: "ok" }
        : sql.includes("sqlite_master")
          ? { name: "__bookshelf_migrations" }
          : undefined,
    ),
    getAllSync: jest.fn((sql: string) => {
      if (sql.includes("PRAGMA table_info"))
        return [
          "id",
          "title",
          "author",
          "coverUri",
          "isRead",
          "rating",
          "workKey",
          "editionKey",
        ].map((name) => ({ name }));
      if (sql.includes("sqlite_master"))
        return [{ type: "table", name: "books_table" }];
      if (sql.includes("__bookshelf_migrations"))
        return migrations.journal.entries.map((e) => ({
          id: e.idx,
          tag: e.tag,
        }));
      return staged.rows;
    }),
    runSync: jest.fn(
      (sql: string, uri: string | null, original: string | number) => {
        for (const row of staged.rows)
          if (row.coverUri === original || row.id === original)
            row.coverUri = uri;
      },
    ),
  };
  jest.mocked(SQLite.deserializeDatabaseSync).mockReturnValue(staged);
  jest
    .mocked(SQLite.openDatabaseSync)
    .mockReturnValue({ closeSync: jest.fn() } as any);
  jest.mocked(SQLite.backupDatabaseSync).mockImplementation(() => {});
});
test("read failure leaves the library untouched and releases the operation guard", async () => {
  mockState.picked = {
    bytes: async () => {
      throw new Error("read failed");
    },
  };
  await expect(importDatabase(live, reload)).rejects.toThrow("read failed");
  expect(SQLite.backupDatabaseSync).not.toHaveBeenCalled();
  mockState.picked = { bytes: async () => backup() };
  expect(await importDatabase(live, reload)).toBe(true);
});
test("restoration maps covers to the new device before publishing and reloads without restart", async () => {
  await importDatabase(live, reload);
  expect(staged.rows[0].coverUri).toContain(
    "file:///new-device/covers/import-",
  );
  expect(mockState.files.get(staged.rows[0].coverUri)).toEqual(
    new Uint8Array([3, 4, 5]),
  );
  expect(SQLite.backupDatabaseSync).toHaveBeenCalledTimes(2);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(staged.closeSync).toHaveBeenCalled();
});
test.each(["write", "publish"])(
  "%s failure removes staged cover directories without reload",
  async (mode) => {
    if (mode === "write") mockState.writeError = true;
    else
      jest
        .mocked(SQLite.backupDatabaseSync)
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
          throw new Error("publication failed");
        });
    await expect(importDatabase(live, reload)).rejects.toThrow();
    expect(mockState.directories.size).toBe(0);
    expect(reload).not.toHaveBeenCalled();
    expect(staged.closeSync).toHaveBeenCalled();
  },
);
test("missing local cover rejects export and closes its snapshot", async () => {
  jest.mocked(SQLite.openDatabaseSync).mockReturnValue(staged);
  await expect(exportDatabase(live)).rejects.toThrow("missing image");
  expect(staged.closeSync).toHaveBeenCalled();
  expect(mockState.files.size).toBe(0);
});
test("export includes cover bytes and explicitly excludes settings", async () => {
  jest.mocked(SQLite.openDatabaseSync).mockReturnValue(staged);
  mockState.files.set(
    "file:///old-device/cover.jpg",
    new Uint8Array([3, 4, 5]),
  );
  await exportDatabase(live);
  const output = [...mockState.files.values()].find(
    (v) => typeof v === "string",
  );
  expect(JSON.parse(output!)).toMatchObject({
    format: "MyBookShelf",
    version: 1,
    settings: false,
    covers: [{ uri: "file:///old-device/cover.jpg", bytes: [3, 4, 5] }],
  });
  expect(staged.closeSync).toHaveBeenCalled();
});

test.each(["ERR_PICKER_CANCELLED", "ERR_FILE_PICKING_CANCELLED"])(
  "%s import cancellation leaves the library untouched and releases the guard",
  async (code) => {
    mockState.pickerError = Object.assign(new Error("Cancelled"), { code });
    await expect(importDatabase(live, reload)).resolves.toBe(false);
    expect(SQLite.deserializeDatabaseSync).not.toHaveBeenCalled();
    expect(SQLite.backupDatabaseSync).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    mockState.pickerError = undefined;
    expect(await importDatabase(live, reload)).toBe(true);
  },
);
test.each(["ERR_PICKER_CANCELLED", "ERR_FILE_PICKING_CANCELLED"])(
  "%s export cancellation closes the snapshot and releases the guard",
  async (code) => {
    jest.mocked(SQLite.openDatabaseSync).mockReturnValue(staged);
    mockState.files.set(
      "file:///old-device/cover.jpg",
      new Uint8Array([3, 4, 5]),
    );
    mockState.directoryError = Object.assign(new Error("Cancelled"), { code });
    await expect(exportDatabase(live)).resolves.toBeUndefined();
    expect(staged.closeSync).toHaveBeenCalledTimes(1);
    expect(mockState.files.size).toBe(1);
    mockState.directoryError = undefined;
    await expect(exportDatabase(live)).resolves.toBeUndefined();
    expect(mockState.files.size).toBe(2);
  },
);
test("unrecognized picker failures remain errors", async () => {
  mockState.pickerError = Object.assign(new Error("Permission denied"), {
    code: "ERR_PERMISSION",
  });
  await expect(importDatabase(live, reload)).rejects.toThrow(
    "Permission denied",
  );
  jest.mocked(SQLite.openDatabaseSync).mockReturnValue(staged);
  mockState.files.set(
    "file:///old-device/cover.jpg",
    new Uint8Array([3, 4, 5]),
  );
  mockState.directoryError = mockState.pickerError;
  await expect(exportDatabase(live)).rejects.toThrow("Permission denied");
  expect(staged.closeSync).toHaveBeenCalled();
});
