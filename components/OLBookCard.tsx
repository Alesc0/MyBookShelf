import { useRouter } from "expo-router";
import React from "react";
import { BookCardShell } from "./BookCardShell";
import { OLBook_Search } from "./types";
import i18n from "@/i18n";

export function OLBookCard({ book }: { book: OLBook_Search }) {
  const router = useRouter();
  const firstEdition = book.editions?.docs?.[0];
  const title = firstEdition?.title || book.title;
  const year = book.first_publish_year;
  const coverUri =
    firstEdition?.cover_i || book.cover_i
      ? `https://covers.openlibrary.org/b/id/${firstEdition?.cover_i || book.cover_i}-M.jpg`
      : undefined;

  const author = book.author_name.length
    ? book.author_name.join(", ")
    : i18n.t("olBook.unknownAuthor");

  return (
    <BookCardShell
      title={title}
      author={author}
      coverUri={coverUri}
      year={year}
      onPress={() =>
        router.push({
          pathname: "/ol-book",
          params: {
            title: title ?? "",
            author,
            coverUri: coverUri ?? "",
            year: year?.toString() ?? "",
            olKey: book.key ?? "",
          },
        })
      }
    />
  );
}
