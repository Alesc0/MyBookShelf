import { Book } from "@/db/schema";
import { OLBook_Search } from "./types";
import { JSX } from "react";
import { BookCard } from "./BookCard";
import { Grid, GridItem } from "./ui/grid";

type Props = {
  books: Book[] | OLBook_Search[];
};

export default function BookGrid({ books }: Props): JSX.Element {
  return (
    <Grid _extra={{ className: "grid-cols-6" }}>
      {books.map((l, i) => (
        <GridItem key={i} _extra={{ className: 'col-span-3' }}>
          <BookCard book={l} />
        </GridItem>
      ))}
    </Grid>
  )
}