import BookGrid from '@/components/BookGrid';
import FabMenu from '@/components/Menu';
import make_req from '@/components/requests';
import { SearchBar } from '@/components/SearchBar';
import { Text } from '@/components/Themed';
import { OLBook_Search } from '@/components/types';
import { Box } from '@/components/ui/box';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';

export default function Search() {
  const [books, setBooks] = useState<OLBook_Search[]>([]);
  const params = useLocalSearchParams<{ query?: string }>();

  useEffect(() => {
    (async () => {
      const encodedQuery = params.query?.replaceAll(' ', '+');
      const json = await make_req('https://openlibrary.org/search.json?q=' + encodedQuery + '&filters&fields=key,title,author_name,editions,cover_i,first_publish_year');
      setBooks(json.docs);
    })();
  }, [params.query]);

  return (
    <Box className="flex-1 bg-background-300 h-[100vh] lg:my-24">
      <ScrollView
        style={{ height: '100%' }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box className="flex flex-col items-center mx-1 lg:my-24 lg:mx-32 py-safe">
          <SearchBar />
          <Text className="w-full px-4 pt-6 text-2xl font-bold">Search results</Text>
          <BookGrid books={books} />
        </Box>
      </ScrollView>
      <FabMenu />
    </Box>
  );
}

