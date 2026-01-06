import { HStack } from "@/components/ui/hstack";
import React from "react";
import { Box } from "./ui/box";
import { Card } from "./ui/card";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";
import { OLBook_Search } from "./types";

type Props = {
  book: OLBook_Search;
};

export function BookCard({ book }: Props) {
  const firstEdition = book.editions?.docs?.[0];
  const title = firstEdition?.title || book.title;
  const year = book.first_publish_year;

  return (
    <Card size="lg" variant="elevated" className="m-3 p-2 w-fit flex flex-col">
      <Box className="h-80">
        <Image
          source={{
            uri: `https://covers.openlibrary.org/b/id/${firstEdition?.cover_i || book.cover_i}-M.jpg`,
          }}
          size="full"
          className="w-full h-full rounded-md"
          accessibilityLabel="image"
          alt="Book Cover"
          resizeMode="contain"
        />
      </Box>

      <VStack
        space="sm"
        style={{ alignItems: "center" }}
        className="my-2"
      >
        <Text
          size="xl"
          bold={true}
          style={{ textAlign: "center" }}
        >
          {title}
          {year ? ` (${year})` : ""}
        </Text>
        <Text size="md" style={{ textAlign: "center" }}>
          {Array.isArray(book.author_name) && book.author_name.length
            ? (() => {
              const authors = book.author_name.slice(0, 2);
              const others = book.author_name.length - authors.length;
              return authors.join(", ") + (others > 0 ? ` and ${others} others` : "");
            })()
            : "Unknown author"}
        </Text>

        <HStack space="md" className="items-center">
        </HStack>
      </VStack>
    </Card>
  );
}
