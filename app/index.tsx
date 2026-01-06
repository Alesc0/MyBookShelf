import BookGrid from '@/components/BookGrid';
import FabMenu from '@/components/Menu';
import { SearchBar } from '@/components/SearchBar';
import { Box } from '@/components/ui/box';
import { Book } from '@/db/schema';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<Book[]>([])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <Box className="flex-1 bg-background-300 h-[100vh] lg:my-24">
      <ScrollView
        style={{ height: '100%' }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box className="flex flex-col items-center mx-1 lg:my-24 lg:mx-32 py-safe">
          <SearchBar />
          <BookGrid books={books} />
        </Box>
      </ScrollView>
      <FabMenu />
    </Box>
  );
}

