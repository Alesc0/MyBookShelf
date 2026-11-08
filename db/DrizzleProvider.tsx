import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Button, Platform, Text, View } from "react-native";
import migrations from "../drizzle/migrations";
import { runMigrations } from "./migrate";
import * as schema from "./schema";
import i18n from "@/i18n";

export type Database = ReturnType<typeof createDatabase>;
function createDatabase(connection: SQLite.SQLiteDatabase) {
  return drizzle(connection, { schema });
}
type Store = {
  db: Database;
  connection: SQLite.SQLiteDatabase;
  reload: () => void;
};
const DatabaseContext = createContext<Store | null>(null);
export function useDatabaseStore() {
  const store = useContext(DatabaseContext);
  if (!store) throw new Error("Database is not ready");
  return store;
}
export function useDatabase() {
  return useDatabaseStore().db;
}

export function DrizzleProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [generation, setGeneration] = useState(0);
  const unsupportedWeb =
    Platform.OS === "web" &&
    (typeof SharedArrayBuffer === "undefined" ||
      !globalThis.crossOriginIsolated);
  useEffect(() => {
    if (unsupportedWeb) {
      setError(true);
      return;
    }
    let connection: SQLite.SQLiteDatabase | undefined;
    let active = true;
    // Warm up the web worker asynchronously before the synchronous Drizzle driver runs.
    void SQLite.openDatabaseAsync("books.db", { useNewConnection: true })
      .then((opened) => {
        connection = opened;
        if (!active) {
          opened.closeSync();
          connection = undefined;
          return;
        }
        runMigrations(opened, migrations);
        setStore({
          db: createDatabase(opened),
          connection: opened,
          reload: () => setGeneration((n) => n + 1),
        });
      })
      .catch((error) => {
        console.error("Library initialization failed", error);
        connection?.closeSync();
        connection = undefined;
        if (active) setError(true);
      });
    return () => {
      active = false;
      connection?.closeSync();
      connection = undefined;
    };
  }, [attempt, unsupportedWeb]);
  if (error)
    return (
      <View>
        <Text>
          {i18n.t(
            unsupportedWeb ? "common.webDatabaseError" : "common.databaseError",
          )}
        </Text>
        <Button
          title={i18n.t("common.retry")}
          onPress={() => {
            setError(false);
            setAttempt((n) => n + 1);
          }}
        />
      </View>
    );
  if (!store) return <ActivityIndicator size="large" />;
  return (
    <DatabaseContext.Provider value={store}>
      <React.Fragment key={generation}>{children}</React.Fragment>
    </DatabaseContext.Provider>
  );
}
