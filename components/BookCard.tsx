
import { HStack } from "@/components/ui/hstack";
import { Star } from "lucide-react-native";
import React from "react";
import { Box } from "./ui/box";
import { Card } from "./ui/card";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";

type Props = {
  book: any;
};

// function displayRating(rating: number): React.ReactNode {
//   const clamped = Math.max(0, Math.min(5, rating));
//   const full = Math.floor(clamped);
//   const hasHalf = clamped - full >= 0.5;
//   const half = hasHalf ? 1 : 0;
//   const empty = 5 - full - half;

//   return rating === 0 ? (
//     <>
//       <Text size="md" className="text-gray-400">
//         not rated
//       </Text>
//     </>
//   ) : (
//     <>
//       <HStack space="xs" className="items-center">
//         {[...Array(full)].map((_, i) => (
//           <Star key={`full-${i}`} size={17} fill="#FACC15" color="#FACC15" />
//         ))}
//         {hasHalf && (
//           <Box key="half" style={{ width: 17, height: 17, position: "relative" }}>
//             <Star size={17} color="#A1A1AA" fill="none" />
//             <Box style={{ position: "absolute", left: 0, top: 0, width: 17 / 2, height: 17, overflow: "hidden" }}>
//               <Star size={17} fill="#FACC15" color="#FACC15" />
//             </Box>
//           </Box>
//         )}
//         {[...Array(empty)].map((_, i) => (
//           <Star key={`empty-${i}`} size={17} color="#A1A1AA" />
//         ))}
//       </HStack>
//       <Text size="md" className="text-gray-400">
//         {clamped.toFixed(1)}
//       </Text>
//     </>
//   );
// }

export function BookCard({ book }: Props) {
  return (
    <Card size="lg" variant="elevated" className="m-3 p-2 w-fit">
      <Box className="h-60">
        <Image
          source={{
            uri: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
          }}
          size="full"
          className="w-full h-full rounded-md"
          accessibilityLabel="image"
          alt="Book Cover"
          resizeMode="contain"
        />
      </Box>

      <VStack space="sm"
        style={{ alignItems: "center" }}
        className="my-2"
      >
        <Text
          size="xl"
          bold={true}
          style={{ textAlign: "center" }}
        >
          {book.title}
        </Text>
        <Text
          size="xl"
          bold={true}
          style={{ textAlign: "center" }}
        >
          {book.author_name}
        </Text>

        <HStack space="md"
          className="items-center"
        >
        </HStack>
      </VStack>

    </Card >
  );
}