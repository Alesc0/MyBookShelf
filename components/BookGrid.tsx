import { BookItem } from "./types";
import { BookCard } from "./BookCard";
import { Grid, GridItem } from "./ui/grid";
export default function BookGrid({ books }: { books: BookItem[] }) {
  return (
    <Grid _extra={{ className: "grid-cols-6" }}>
      {books.map((item) => (
        <GridItem
          key={
            item.source === "local" ? `local-${item.book.id}` : item.book.key
          }
          _extra={{ className: "col-span-3" }}
        >
          <BookCard item={item} />
        </GridItem>
      ))}
    </Grid>
  );
}
