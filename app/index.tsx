import BookGrid from '@/components/BookGrid';
import FabMenu from '@/components/Menu';
import { SearchBar } from '@/components/SearchBar';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { getBooks } from '@/db/books';
import { useDatabase } from '@/db/DrizzleProvider';
import { Book } from '@/db/schema';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView } from 'react-native';

export default function Home() {
  const db = useDatabase();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  const loadBooks = useCallback(async () => {
    const result = await getBooks(db);
    setBooks(result);
  }, [db]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  }, [loadBooks]);

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
          <SearchBar
            trailing={
              <Pressable
                onPress={() => router.push('/settings')}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  backgroundColor: '#ffffff',
                }}
              >
                <Settings size={22} color="#374151" />
              </Pressable>
            }
          />
          {books.length === 0 && !refreshing ? (
            <Box className="flex-1 items-center justify-center py-20">
              <Text className="text-typography-400 text-lg text-center px-6">
                {i18n.t("home.empty")}
              </Text>
            </Box>
          ) : (
            <BookGrid books={books} />
          )}
        </Box>
      </ScrollView>
      <FabMenu />
    </Box>
  );
}

