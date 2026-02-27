import { Book } from "@/db/schema";
import React from "react";
import { OLBook_Search } from "./types";
import { LocalBookCard } from "./LocalBookCard";
import { OLBookCard } from "./OLBookCard";

type Props = {
  book: Book | OLBook_Search;
};

function isOLBook(book: Book | OLBook_Search): book is OLBook_Search {
  return "editions" in book || "author_name" in book;
}

export function BookCard({ book }: Props) {
  if (isOLBook(book)) {
    return <OLBookCard book={book} />;
  }
  return <LocalBookCard book={book} />;
}
