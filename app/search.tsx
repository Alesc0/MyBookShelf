import BookGrid from '@/components/BookGrid';
import FabMenu from '@/components/Menu';
import { SearchBar } from '@/components/SearchBar';
import { Text } from '@/components/Themed';
import { Box } from '@/components/ui/box';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';

export type OLBook_Search = {
  author_key?: string[];
  author_name?: string[];
  cover_edition_key?: string;
  cover_i?: number;
  ebook_access?: string;
  edition_count?: number;
  first_publish_year?: number;
  has_fulltext?: boolean;
  ia?: string[];
  ia_collection_s?: string;
  key?: string;
  language?: string[];
  lending_edition_s?: string;
  lending_identifier_s?: string;
  public_scan_b?: boolean;
  title?: string;
};


export default function Home() {
  const [books, setBooks] = useState<OLBook_Search[]>([]);
  const params = useLocalSearchParams<{ query?: string }>();

  useEffect(() => {
    const encodedQuery = encodeURIComponent(params.query ?? '');
    fetch('https://openlibrary.org/search.json?title=' + encodedQuery)
      .then(response => response.json())
      .then(json => {
        console.log(json);
        setBooks(json.docs || []);
      })
      .catch(error => {
        console.error(error);
      });
  }, [params.query]);
  console.log(books);

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

