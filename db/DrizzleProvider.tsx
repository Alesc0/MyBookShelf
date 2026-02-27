import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useReducer } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import migrations from "../drizzle/migrations";
import * as schema from "./schema";

const expoDb = SQLite.openDatabaseSync("books.db");
const db = drizzle(expoDb, { schema });

export type Database = typeof db;

const DatabaseContext = createContext<Database>(db);

export function useDatabase(): Database {
  return useContext(DatabaseContext);
}

type MigrationState = {
  success: boolean;
  error: Error | undefined;
};

async function runMigrations() {
  const { journal, migrations: migrationFiles } = migrations;
  for (const entry of journal.entries) {
    const key = `m${entry.idx.toString().padStart(4, "0")}`;
    const sql = (migrationFiles as Record<string, string>)[key];
    if (!sql) throw new Error(`Missing migration: ${entry.tag}`);
    const statements = sql.split("--> statement-breakpoint");
    for (const stmt of statements) {
      let trimmed = stmt.trim();
      if (!trimmed) continue;
      // Make CREATE TABLE idempotent so migrations don't fail on existing DBs
      trimmed = trimmed.replace(
        /CREATE TABLE(?!\s+IF NOT EXISTS)/gi,
        "CREATE TABLE IF NOT EXISTS",
      );
      try {
        expoDb.execSync(trimmed);
      } catch (e: any) {
        // Ignore "duplicate column" errors from re-running ALTER TABLE ADD
        if (e?.message?.includes("duplicate column name")) continue;
        throw e;
      }
    }
  }
}

export function DrizzleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: MigrationState, a: { type: string; error?: Error }): MigrationState => {
      switch (a.type) {
        case "done":
          return { success: true, error: undefined };
        case "error":
          return { success: false, error: a.error };
        default:
          return s;
      }
    },
    { success: false, error: undefined },
  );

  useEffect(() => {
    runMigrations()
      .then(() => dispatch({ type: "done" }))
      .catch((e) => dispatch({ type: "error", error: e }));
  }, []);

  if (state.error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Migration error: {state.error.message}</Text>
      </View>
    );
  }

  if (!state.success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}
