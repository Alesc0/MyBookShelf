import {BookCard} from "@/components/BookCard";
import {LocalBookCard} from "@/components/LocalBookCard";
import FabMenu from "@/components/Menu";
import make_req from "@/components/requests";
import {SearchBar} from "@/components/SearchBar";
import {OLBook_Search} from "@/components/types";
import {Box} from "@/components/ui/box";
import {Spinner} from "@/components/ui/spinner";
import {Text} from "@/components/ui/text";
import {getBooks, searchBooks} from "@/db/books";
import {useDatabase} from "@/db/DrizzleProvider";
import {Book} from "@/db/schema";
import i18n from "@/i18n";
import {useRouter} from "expo-router";
import {ArrowLeft, ChevronDown, ChevronRight, Settings} from "lucide-react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {FlatList, Pressable, RefreshControl, ScrollView, TouchableOpacity} from "react-native";

const PAGE_SIZE = 20;

const LANGUAGES: {label: string; code: string}[] = [
  {label: "Any", code: ""},
  {label: "English", code: "eng"},
  {label: "Portuguese", code: "por"},
  {label: "Spanish", code: "spa"},
  {label: "French", code: "fre"},
  {label: "German", code: "ger"},
  {label: "Italian", code: "ita"},
  {label: "Japanese", code: "jpn"},
  {label: "Chinese", code: "chi"},
];

function buildOLUrl(q: string, page: number, lang: string) {
  const base = `https://openlibrary.org/search.json?q=${q.replaceAll(" ", "+")}&page=${page}&limit=${PAGE_SIZE}&fields=key,title,author_name,editions,cover_i,first_publish_year`;
  return lang ? `${base}&language=${lang}` : base;
}

type ListItem =
  | {type: "header"; section: "local" | "online"; label: string; count: number}
  | {type: "row"; section: "local" | "online"; books: (Book | OLBook_Search)[]};

function buildListData(
  localResults: Book[],
  olResults: OLBook_Search[],
  localCollapsed: boolean,
  onlineCollapsed: boolean,
): ListItem[] {
  const items: ListItem[] = [];

  if (localResults.length > 0) {
    items.push({type: "header", section: "local", label: i18n.t("search.myLibrary"), count: localResults.length});
    if (!localCollapsed) {
      for (let i = 0; i < localResults.length; i += 2) {
        items.push({type: "row", section: "local", books: localResults.slice(i, i + 2)});
      }
    }
  }

  if (olResults.length > 0) {
    items.push({type: "header", section: "online", label: i18n.t("search.onlineResults"), count: olResults.length});
    if (!onlineCollapsed) {
      for (let i = 0; i < olResults.length; i += 2) {
        items.push({type: "row", section: "online", books: olResults.slice(i, i + 2)});
      }
    }
  }

  return items;
}

export default function Home() {
  const db = useDatabase();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [localResults, setLocalResults] = useState<Book[]>([]);
  const [olResults, setOlResults] = useState<OLBook_Search[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [onlineCollapsed, setOnlineCollapsed] = useState(false);
  const [langFilter, setLangFilter] = useState("");
  const langFilterRef = useRef("");
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAllBooks = useCallback(async () => {
    const result = await getBooks(db);
    setAllBooks(result);
  }, [db]);

  useEffect(() => {
    loadAllBooks();
  }, [loadAllBooks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllBooks();
    setRefreshing(false);
  }, [loadAllBooks]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      setSubmitted(false);
      if (!text.trim()) {
        setSuggestions([]);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const results = await searchBooks(db, text);
        setSuggestions(results);
      }, 200);
    },
    [db],
  );

  const handleSearch = useCallback(
    async (q: string, lang?: string) => {
      if (!q.trim()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSuggestions([]);
      setSubmitted(true);
      setLocalCollapsed(false);
      setOnlineCollapsed(false);
      pageRef.current = 1;
      hasMoreRef.current = true;
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setLoading(true);

      const activeLang = lang ?? langFilterRef.current;

      const [localRes, onlineJson] = await Promise.all([
        searchBooks(db, q),
        make_req(buildOLUrl(q, 1, activeLang)),
      ]);

      setLocalResults(localRes);
      const docs: OLBook_Search[] = onlineJson.docs ?? [];
      setOlResults(docs);
      hasMoreRef.current = docs.length >= PAGE_SIZE;
      setLoading(false);
    },
    [db],
  );

  const handleLangChange = useCallback(
    (code: string) => {
      setLangFilter(code);
      langFilterRef.current = code;
      if (submitted && query.trim()) handleSearch(query, code);
    },
    [submitted, query, handleSearch],
  );

  const loadMore = () => {
    if (!hasMoreRef.current || loadingMoreRef.current || !query.trim() || !submitted) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    make_req(buildOLUrl(query, nextPage, langFilterRef.current)).then((json) => {
      const docs: OLBook_Search[] = json.docs ?? [];
      pageRef.current = nextPage;
      setOlResults((prev) => [...prev, ...docs]);
      hasMoreRef.current = docs.length >= PAGE_SIZE;
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  };

  const listData = submitted
    ? buildListData(localResults, olResults, localCollapsed, onlineCollapsed)
    : [];

  const renderSectionHeader = (item: ListItem & {type: "header"}) => {
    const collapsed = item.section === "local" ? localCollapsed : onlineCollapsed;
    const toggle = () =>
      item.section === "local"
        ? setLocalCollapsed((c) => !c)
        : setOnlineCollapsed((c) => !c);
    return (
      <TouchableOpacity
        onPress={toggle}
        style={{flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12}}
        className="bg-background-200 w-full"
      >
        {collapsed ? (
          <ChevronRight size={18} color="#6b7280" />
        ) : (
          <ChevronDown size={18} color="#6b7280" />
        )}
        <Text className="ml-2 font-semibold text-typography-700 text-base flex-1">{item.label}</Text>
        <Text className="text-typography-400 text-sm">{item.count}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({item}: {item: ListItem}) => {
    if (item.type === "header") return renderSectionHeader(item);
    return (
      <Box className="flex-row w-full">
        {item.books.map((book, idx) => (
          <Box key={idx} className="flex-1 max-w-[50%]">
            <BookCard book={book} />
          </Box>
        ))}
        {item.books.length === 1 && <Box className="flex-1 max-w-[50%]" />}
      </Box>
    );
  };

  const handleBack = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setSubmitted(false);
    setSuggestions([]);
    setLocalResults([]);
    setOlResults([]);
    setLangFilter("");
    langFilterRef.current = "";
  }, []);

  const settingsButton = (
    <Pressable
      onPress={() => router.push("/settings")}
      style={{
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#ffffff",
      }}
    >
      <Settings size={22} color="#374151" />
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-background-300 h-[100vh] lg:my-24">
      <Box className="pt-safe mx-1 lg:mx-32">
        <SearchBar
          value={query}
          onSearch={handleSearch}
          onChangeText={handleChangeText}
          onBlur={() => setSuggestions([])}
          suggestions={suggestions}
          leading={
            submitted ? (
              <Pressable
                onPress={handleBack}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <ArrowLeft size={22} color="#374151" />
              </Pressable>
            ) : undefined
          }
          onSuggestionSelect={(book) => {
            setSuggestions([]);
            router.push({pathname: "/book/[id]", params: {id: book.id}});
          }}
          trailing={settingsButton}
        />
      </Box>

      {
        loading ? (
          <Box className="flex-1 items-center justify-center">
            <Spinner size="large" />
          </Box>
        ) : submitted ? (
          <FlatList<ListItem>
            key="search-results"
            style={{flex: 1}}
            data={listData}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            ListHeaderComponent={
              olResults.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: "center"}}
                >
                  {LANGUAGES.map(({label, code}) => {
                    const active = langFilter === code;
                    return (
                      <Pressable
                        key={code || "any"}
                        onPress={() => handleLangChange(code)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: active ? "#374151" : "#d1d5db",
                          backgroundColor: active ? "#374151" : "#ffffff",
                        }}
                      >
                        <Text style={{color: active ? "#ffffff" : "#374151", fontSize: 14, fontWeight: "500"}}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) || null
            }
            ListEmptyComponent={() => (
              <Box className="items-center justify-center py-20">
                <Text className="text-typography-400 text-lg text-center px-6">
                  {i18n.t("search.noResults")}
                </Text>
              </Box>
            )}
            ListFooterComponent={
              loadingMore ? (
                <Box className="items-center py-6">
                  <Spinner size="small" />
                </Box>
              ) : null
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{paddingBottom: 80}}
            className="mx-1 lg:mx-32"
          />
        ) : (
          <FlatList<Book>
            key="library"
            style={{flex: 1}}
            data={allBooks}
            keyExtractor={(_, i) => i.toString()}
            numColumns={2}
            renderItem={({item}) => (
              <Box className="flex-1 max-w-[50%]">
                <LocalBookCard book={item} />
              </Box>
            )}
            ListEmptyComponent={() => (
              <Box className="flex-1 items-center justify-center py-20">
                <Text className="text-typography-400 text-lg text-center px-6">
                  {i18n.t("home.empty")}
                </Text>
              </Box>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{flexGrow: 1, paddingBottom: 80}}
            className="mx-1 lg:mx-32"
          />
        )
      }
      <FabMenu />
    </Box >
  );
}