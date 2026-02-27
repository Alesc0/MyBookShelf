import { BackButton } from "@/components/BackButton";
import BookGrid from "@/components/BookGrid";
import FabMenu from "@/components/Menu";
import make_req from "@/components/requests";
import { SearchBar } from "@/components/SearchBar";
import { Text } from "@/components/Themed";
import { OLBook_Search } from "@/components/types";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { searchBooks } from "@/db/books";
import { useDatabase } from "@/db/DrizzleProvider";
import { Book } from "@/db/schema";
import i18n from "@/i18n";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import { BookCard } from "@/components/BookCard";

type SearchFilter = "new" | "my-books";

const PAGE_SIZE = 20;

export default function Search() {
  const db = useDatabase();
  const [filter, setFilter] = useState<SearchFilter>("my-books");
  const [olBooks, setOlBooks] = useState<OLBook_Search[]>([]);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const params = useLocalSearchParams<{ query?: string }>();

  // Initial fetch when query or filter changes
  useEffect(() => {
    if (!params.query) return;
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setLoading(true);

    if (filter === "new") {
      setOlBooks([]);
      (async () => {
        const encodedQuery = params.query?.replaceAll(" ", "+");
        const json = await make_req(
          `https://openlibrary.org/search.json?q=${encodedQuery}&page=1&limit=${PAGE_SIZE}&fields=key,title,author_name,editions,cover_i,first_publish_year`,
        );
        const docs: OLBook_Search[] = json.docs ?? [];
        setOlBooks(docs);
        hasMoreRef.current = docs.length >= PAGE_SIZE;
        setLoading(false);
      })();
    } else {
      (async () => {
        const results = await searchBooks(db, params.query!);
        setLocalBooks(results);
        hasMoreRef.current = false;
        setLoading(false);
      })();
    }
  }, [params.query, filter]);

  const loadMore = () => {
    if (
      filter !== "new" ||
      !hasMoreRef.current ||
      loadingMoreRef.current ||
      !params.query
    )
      return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;
    const encodedQuery = params.query.replaceAll(" ", "+");
    make_req(
      `https://openlibrary.org/search.json?q=${encodedQuery}&page=${nextPage}&limit=${PAGE_SIZE}&fields=key,title,author_name,editions,cover_i,first_publish_year`,
    ).then((json) => {
      const docs: OLBook_Search[] = json.docs ?? [];
      pageRef.current = nextPage;
      setOlBooks((prev) => [...prev, ...docs]);
      hasMoreRef.current = docs.length >= PAGE_SIZE;
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  };

  const books = filter === "new" ? olBooks : localBooks;

  const renderHeader = () => (
    <>
      <BackButton />
      <SearchBar />
      <HStack space="sm" className="w-full px-4 pt-4">
        <Button
          size="sm"
          variant={filter === "new" ? "solid" : "outline"}
          onPress={() => setFilter("new")}
        >
          <ButtonText>{i18n.t("search.newBooks")}</ButtonText>
        </Button>
        <Button
          size="sm"
          variant={filter === "my-books" ? "solid" : "outline"}
          onPress={() => setFilter("my-books")}
        >
          <ButtonText>{i18n.t("search.myBooks")}</ButtonText>
        </Button>
      </HStack>
      <Text className="w-full px-4 pt-4 text-2xl font-bold">
        {books.length > 0
          ? i18n.t("search.results", { count: books.length })
          : i18n.t("search.noResults")}
      </Text>
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <Box className="items-center py-6">
          <Spinner size="small" />
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="flex-1 bg-background-300 h-[100vh] lg:my-24">
      {loading ? (
        <Box className="flex flex-col items-center mx-1 lg:my-24 lg:mx-32 py-safe">
          {renderHeader()}
          <Box className="flex-1 items-center justify-center py-20">
            <Spinner size="large" />
          </Box>
        </Box>
      ) : (
        <FlatList<Book | OLBook_Search>
          data={books}
          keyExtractor={(_, i) => i.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <Box className="flex-1 max-w-[50%]">
              <BookCard book={item} />
            </Box>
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
          className="mx-1 lg:my-24 lg:mx-32 py-safe"
        />
      )}
      <FabMenu />
    </Box>
  );
}
