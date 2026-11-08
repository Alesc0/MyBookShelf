import React from "react";
import { BookItem } from "./types";
import { LocalBookCard } from "./LocalBookCard";
import { OLBookCard } from "./OLBookCard";
export function BookCard({ item }: { item: BookItem }) {
  return item.source === "online" ? (
    <OLBookCard book={item.book} />
  ) : (
    <LocalBookCard book={item.book} />
  );
}
