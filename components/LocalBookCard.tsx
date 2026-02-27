import { Book } from "@/db/schema";
import { useRouter } from "expo-router";
import React from "react";
import { BookCardShell } from "./BookCardShell";

export function LocalBookCard({ book }: { book: Book; }) {
  const router = useRouter();

  return (
    <BookCardShell
      title={book.title}
      author={book.author}
      coverUri={book.coverUri ?? undefined}
      rating={book.rating}
      onPress={() => router.push(`/book/${book.id}`)}
    />
  );
}
