import BookGrid from '@/components/BookGrid';
import { SearchBar } from '@/components/SearchBar';
import { Box } from '@/components/ui/box';
import { Book, booksTable } from '@/db/schema';
import { like } from 'drizzle-orm';
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { openDatabaseSync } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import migrations from '../drizzle/migrations';
import FabMenu from '@/components/Menu';

// const expoDb = openDatabaseSync("books.db");
// const db = drizzle(expoDb);

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<Book[]>([])

  // useDrizzleStudio(expoDb);

  // const { error } = useMigrations(db, migrations);
  // if (error) {
  //   console.log(error);
  // }

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       if (search != "") {
  //         setBooks(await db.select().from(booksTable).where(like(booksTable.title, "%" + search + "%")));
  //       }
  //       else setBooks(await db.select().from(booksTable));
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   })();
  // }, [search]);


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

