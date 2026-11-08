import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import * as SQLite from "expo-sqlite";
import { DrizzleProvider, useDatabase } from "../db/DrizzleProvider";
import { runMigrations } from "../db/migrate";
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));
jest.mock("drizzle-orm/expo-sqlite", () => ({
  drizzle: jest.fn((connection) => ({ connection })),
}));
jest.mock("../db/migrate", () => ({ runMigrations: jest.fn() }));
let rendered = 0;
function Consumer() {
  useDatabase();
  rendered++;
  return null;
}
beforeEach(() => {
  jest.clearAllMocks();
  rendered = 0;
});
test("provider owns a unique connection, waits for migrations and closes on unmount", async () => {
  const connection = { closeSync: jest.fn() } as any;
  let resolve!: (db: SQLite.SQLiteDatabase) => void;
  jest.mocked(SQLite.openDatabaseAsync).mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <DrizzleProvider>
        <Consumer />
      </DrizzleProvider>,
    );
  });
  expect(rendered).toBe(0);
  await act(async () => resolve(connection));
  expect(runMigrations).toHaveBeenCalledWith(connection, expect.any(Object));
  expect(rendered).toBe(1);
  expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith("books.db", {
    useNewConnection: true,
  });
  await act(async () => root.unmount());
  expect(connection.closeSync).toHaveBeenCalledTimes(1);
});
test("an opening connection that resolves after unmount closes without publishing state", async () => {
  const connection = { closeSync: jest.fn() } as any;
  let resolve!: (db: SQLite.SQLiteDatabase) => void;
  jest.mocked(SQLite.openDatabaseAsync).mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <DrizzleProvider>
        <Consumer />
      </DrizzleProvider>,
    );
  });
  await act(async () => root.unmount());
  await act(async () => resolve(connection));
  expect(connection.closeSync).toHaveBeenCalledTimes(1);
  expect(runMigrations).not.toHaveBeenCalled();
  expect(rendered).toBe(0);
});
