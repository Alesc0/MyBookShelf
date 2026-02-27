import { HStack } from "@/components/ui/hstack";
import i18n from "@/i18n";
import { Star } from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";
import { Box } from "./ui/box";
import { Card } from "./ui/card";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";

export function BookCardShell({
  title,
  author,
  coverUri,
  year,
  rating,
  onPress,
}: {
  title?: string;
  author: string;
  coverUri?: string;
  year?: number;
  rating?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card size="lg" variant="elevated" className="m-3 p-2 w-fit flex flex-col">
      <Box className="h-80">
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            size="full"
            className="w-full h-full rounded-md"
            accessibilityLabel="image"
            alt="Book Cover"
            resizeMode="contain"
          />
        ) : (
          <Box className="w-full h-full rounded-md bg-background-200 items-center justify-center">
            <Text className="text-typography-400">{i18n.t("bookDetail.noCover")}</Text>
          </Box>
        )}
      </Box>

      <VStack space="sm" style={{ alignItems: "center" }} className="my-2">
        <Text size="xl" bold={true} style={{ textAlign: "center" }}>
          {title}
          {year ? ` (${year})` : ""}
        </Text>
        <Text size="md" style={{ textAlign: "center" }}>
          {author}
        </Text>

        {rating != null && rating > 0 && (
          <HStack space="xs" className="items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                color={s <= rating ? "#f59e0b" : "#9ca3af"}
                fill={s <= rating ? "#f59e0b" : "none"}
              />
            ))}
          </HStack>
        )}
      </VStack>
    </Card>
    </Pressable>
  );
}
