import { BookCard } from "@/components/BookCard";
import FabMenu from "@/components/Menu";
import { SearchBar } from "@/components/SearchBar";
import { BookItem } from "@/components/types";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getBooks, searchBooks, LIBRARY_PAGE_SIZE } from "@/db/books";
import { useDatabase } from "@/db/DrizzleProvider";
import { Book } from "@/db/schema";
import { useBookSearch } from "@/hooks/useBookSearch";
import i18n from "@/i18n";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSettings } from "@/components/SettingsContext";

const LANGUAGES = ["", "eng", "por", "spa", "fre", "ger", "ita", "jpn", "chi"];
type Row =
  | { key: string; type: "header"; section: "local" | "online"; count: number }
  | { key: string; type: "row"; books: BookItem[] };
const itemKey = (item: BookItem) =>
  item.source === "local" ? `local-${item.book.id}` : item.book.key;
export default function Home() {
  const db = useDatabase();
  const router = useRouter();
  const { colorMode } = useSettings();
  const iconColor = colorMode === "dark" ? "#e5e7eb" : "#374151";
  const columns = useWindowDimensions().width < 380 ? 1 : 2;
  const search = useBookSearch(db);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [libraryError, setLibraryError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [libraryMore, setLibraryMore] = useState(false);
  const libraryBusy = useRef(false);
  const libraryGeneration = useRef(0);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [collapsed, setCollapsed] = useState({ local: false, online: false });
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionGeneration = useRef(0);
  const cancelSuggestions = useCallback(() => {
    suggestionGeneration.current++;
    if (debounce.current) clearTimeout(debounce.current);
    setSuggestions([]);
  }, []);
  useEffect(
    () => () => {
      suggestionGeneration.current++;
      if (debounce.current) clearTimeout(debounce.current);
      libraryGeneration.current++;
    },
    [],
  );
  const loadLibrary = useCallback(async () => {
    const id = ++libraryGeneration.current;
    libraryBusy.current = true;
    setRefreshing(true);
    try {
      const rows = await getBooks(db);
      if (id === libraryGeneration.current) {
        setAllBooks(rows);
        setLibraryMore(rows.length === LIBRARY_PAGE_SIZE);
        setLibraryError(false);
      }
    } catch {
      if (id === libraryGeneration.current) setLibraryError(true);
    } finally {
      if (id === libraryGeneration.current) {
        libraryBusy.current = false;
        setRefreshing(false);
      }
    }
  }, [db]);
  useFocusEffect(
    useCallback(() => {
      void loadLibrary();
      void search.refreshLocal();
    }, [loadLibrary, search.refreshLocal]),
  );
  const moreLibrary = async () => {
    if (!libraryMore || libraryBusy.current || libraryError) return;
    const id = libraryGeneration.current;
    libraryBusy.current = true;
    try {
      const rows = await getBooks(db, allBooks.length);
      if (id === libraryGeneration.current) {
        setAllBooks((prev) => [...prev, ...rows]);
        setLibraryMore(rows.length === LIBRARY_PAGE_SIZE);
      }
    } catch {
      if (id === libraryGeneration.current) setLibraryError(true);
    } finally {
      if (id === libraryGeneration.current) libraryBusy.current = false;
    }
  };
  const handleChangeText = (text: string) => {
    cancelSuggestions();
    setQuery(text);
    search.reset();
    if (!text.trim()) return;
    const id = suggestionGeneration.current;
    debounce.current = setTimeout(async () => {
      try {
        const rows = await searchBooks(db, text.trim(), 8);
        if (suggestionGeneration.current === id) setSuggestions(rows);
      } catch {
        if (suggestionGeneration.current === id) setLibraryError(true);
      }
    }, 200);
  };
  const submit = (q: string, language = search.criteria?.language ?? "") => {
    cancelSuggestions();
    setCollapsed({ local: false, online: false });
    search.submit(q, language);
  };
  const rows: Row[] = [];
  for (const section of ["local", "online"] as const) {
    const items: BookItem[] =
      section === "local"
        ? search.local.map((book) => ({ source: "local", book }))
        : search.online.map((book) => ({ source: "online", book }));
    if (!items.length) continue;
    rows.push({ key: section, type: "header", section, count: items.length });
    if (!collapsed[section])
      for (let i = 0; i < items.length; i += columns)
        rows.push({
          key: itemKey(items[i]),
          type: "row",
          books: items.slice(i, i + columns),
        });
  }
  const retry = (onPress: () => void) => (
    <Box className="p-4">
      <Text accessibilityRole="alert">{i18n.t("common.loadError")}</Text>
      <Button onPress={onPress}>
        <ButtonText>{i18n.t("common.retry")}</ButtonText>
      </Button>
    </Box>
  );
  const renderBooks = (items: BookItem[]) => (
    <Box className="flex-row w-full">
      {items.map((item) => (
        <Box key={itemKey(item)} style={{ width: `${100 / columns}%` }}>
          <BookCard item={item} />
        </Box>
      ))}
    </Box>
  );
  return (
    <Box className="flex-1 bg-background-300 pt-safe">
      <SearchBar
        value={query}
        onChangeText={handleChangeText}
        onSearch={(q) => submit(q)}
        suggestions={suggestions}
        onBlur={cancelSuggestions}
        onSuggestionSelect={(book) => {
          cancelSuggestions();
          router.push({ pathname: "/book/[id]", params: { id: book.id } });
        }}
        leading={
          search.criteria ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18n.t("common.back")}
              onPress={() => {
                cancelSuggestions();
                setQuery("");
                search.reset();
              }}
              className="p-2 rounded-xl bg-background-0 border border-outline-300"
            >
              <ArrowLeft color={iconColor} />
            </Pressable>
          ) : undefined
        }
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t("settings.title")}
            onPress={() => router.push("/settings")}
            className="p-2 rounded-xl bg-background-0 border border-outline-300"
          >
            <Settings color={iconColor} />
          </Pressable>
        }
      />
      {search.criteria ? (
        <FlatList<Row>
          data={rows}
          key={`search-${columns}`}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={
            <ScrollView
              horizontal
              contentContainerStyle={{ padding: 12, gap: 8 }}
            >
              {LANGUAGES.map((code) => (
                <Pressable
                  key={code || "any"}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: search.criteria?.language === code,
                  }}
                  onPress={() => submit(search.criteria!.query, code)}
                  className={`p-3 rounded-full border border-outline-300 ${search.criteria?.language === code ? "bg-background-800" : "bg-background-0"}`}
                >
                  <Text
                    className={
                      search.criteria?.language === code
                        ? "text-typography-0"
                        : "text-typography-800"
                    }
                  >
                    {i18n.t(`languages.${code || "any"}`)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          }
          renderItem={({ item }) =>
            item.type === "row" ? (
              renderBooks(item.books)
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !collapsed[item.section] }}
                onPress={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [item.section]: !prev[item.section],
                  }))
                }
                className="flex-row items-center p-4 bg-background-200"
              >
                {collapsed[item.section] ? (
                  <ChevronRight color={iconColor} />
                ) : (
                  <ChevronDown color={iconColor} />
                )}
                <Text className="flex-1">
                  {i18n.t(
                    item.section === "local"
                      ? "search.myLibrary"
                      : "search.onlineResults",
                  )}{" "}
                  ({item.count})
                </Text>
              </Pressable>
            )
          }
          ListEmptyComponent={() =>
            !search.loading && !search.error && !search.localError ? (
              <Text className="p-6 text-center">
                {i18n.t("search.noResults")}
              </Text>
            ) : null
          }
          ListFooterComponent={
            <Box>
              {search.localError && retry(() => void search.refreshLocal())}
              {search.localMore && (
                <Button onPress={search.moreLocal}>
                  <ButtonText>{i18n.t("search.moreLocal")}</ButtonText>
                </Button>
              )}
              {(search.loading || search.loadingMore) && <Spinner />}
              {search.error && retry(() => void search.more())}
            </Box>
          }
          onEndReached={() => {
            if (!search.error) void search.more();
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <FlatList<Book>
          key={`library-${columns}`}
          data={allBooks}
          numColumns={columns}
          keyExtractor={(book) => String(book.id)}
          renderItem={({ item }) => (
            <Box style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
              <BookCard item={{ source: "local", book: item }} />
            </Box>
          )}
          ListHeaderComponent={
            libraryError ? retry(() => void loadLibrary()) : null
          }
          ListEmptyComponent={() =>
            !refreshing && !libraryError ? (
              <Text className="p-6 text-center">{i18n.t("home.empty")}</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadLibrary} />
          }
          onEndReached={moreLibrary}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <FabMenu />
    </Box>
  );
}
