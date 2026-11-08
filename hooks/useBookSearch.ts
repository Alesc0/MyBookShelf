import { useCallback, useEffect, useRef, useState } from "react";
import { searchBooks, LIBRARY_PAGE_SIZE } from "@/db/books";
import type { Database } from "@/db/DrizzleProvider";
import type { Book } from "@/db/schema";
import type { OLBook_Search } from "@/components/types";
import { PAGE_SIZE, searchOnline } from "@/components/openLibrary";

export function useBookSearch(db: Database) {
  const [criteria, setCriteria] = useState<{
    query: string;
    language: string;
  } | null>(null);
  const [local, setLocal] = useState<Book[]>([]);
  const [online, setOnline] = useState<OLBook_Search[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [localError, setLocalError] = useState(false);
  const [localMore, setLocalMore] = useState(false);
  const generation = useRef<{
    query: string;
    language: string;
    controller: AbortController;
    page: number;
    more: boolean;
    busy: boolean;
    localCount: number;
  } | null>(null);
  const invalidate = useCallback(() => {
    generation.current?.controller.abort();
    generation.current = null;
  }, []);
  useEffect(() => invalidate, [invalidate]);
  const reset = useCallback(() => {
    invalidate();
    setCriteria(null);
    setLocal([]);
    setOnline([]);
    setLoading(false);
    setLoadingMore(false);
    setError(false);
    setLocalError(false);
    setLocalMore(false);
  }, [invalidate]);
  const refreshLocal = useCallback(async () => {
    const g = generation.current;
    if (!g) return;
    try {
      const rows = await searchBooks(db, g.query, g.localCount);
      if (generation.current !== g) return;
      setLocal(rows);
      setLocalMore(rows.length >= g.localCount);
      setLocalError(false);
    } catch {
      if (generation.current === g) setLocalError(true);
    }
  }, [db]);
  const submit = useCallback(
    (query: string, language = "") => {
      if (!query.trim()) return;
      invalidate();
      const g = {
        query: query.trim(),
        language,
        controller: new AbortController(),
        page: 0,
        more: true,
        busy: false,
        localCount: LIBRARY_PAGE_SIZE,
      };
      generation.current = g;
      setCriteria({ query: g.query, language });
      setLocal([]);
      setLocalMore(false);
      setOnline([]);
      setError(false);
      setLocalError(false);
      setLoadingMore(false);
      setLoading(true);
      void refreshLocal();
      g.busy = true;
      void searchOnline(g.query, 1, language, g.controller.signal)
        .then((rows) => {
          if (generation.current !== g) return;
          setOnline(rows);
          g.page = 1;
          g.more = rows.length >= PAGE_SIZE;
        })
        .catch(() => {
          if (generation.current === g) setError(true);
        })
        .finally(() => {
          if (generation.current === g) {
            g.busy = false;
            setLoading(false);
          }
        });
    },
    [invalidate, refreshLocal],
  );
  const more = useCallback(async () => {
    const g = generation.current;
    if (!g || g.busy || !g.more) return;
    g.busy = true;
    setLoadingMore(true);
    setError(false);
    try {
      const rows = await searchOnline(
        g.query,
        g.page + 1,
        g.language,
        g.controller.signal,
      );
      if (generation.current !== g) return;
      setOnline((prev) => [
        ...prev,
        ...rows.filter((row) => !prev.some((old) => old.key === row.key)),
      ]);
      g.page += 1;
      g.more = rows.length >= PAGE_SIZE;
    } catch {
      if (generation.current === g) setError(true);
    } finally {
      if (generation.current === g) {
        g.busy = false;
        setLoadingMore(false);
      }
    }
  }, []);
  const moreLocal = useCallback(() => {
    if (generation.current) generation.current.localCount += LIBRARY_PAGE_SIZE;
    void refreshLocal();
  }, [refreshLocal]);
  return {
    criteria,
    local,
    online,
    loading,
    loadingMore,
    error,
    localError,
    localMore,
    submit,
    reset,
    more,
    moreLocal,
    refreshLocal,
  };
}
