import { BackButton } from "@/components/BackButton";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { deleteBook, getBookById, toggleRead, setRating } from "@/db/books";
import { useDatabase } from "@/db/DrizzleProvider";
import { Book } from "@/db/schema";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import i18n from "@/i18n";

export default function BookDetail() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBook = useCallback(async () => {
    if (!id) return;
    const result = await getBookById(db, Number(id));
    setBook(result ?? null);
    setLoading(false);
  }, [db, id]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  const handleToggleRead = async () => {
    if (!book) return;
    await toggleRead(db, book.id, !book.isRead);
    await loadBook();
  };

  const handleRating = async (value: number) => {
    if (!book) return;
    const newRating = book.rating === value ? 0 : value;
    await setRating(db, book.id, newRating);
    await loadBook();
  };

  const handleDelete = () => {
    if (!book) return;
    Alert.alert(i18n.t("bookDetail.deleteTitle"), i18n.t("bookDetail.deleteMessage", { title: book.title }), [
      { text: i18n.t("bookDetail.cancel"), style: "cancel" },
      {
        text: i18n.t("bookDetail.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteBook(db, book.id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Box className="flex-1 bg-background-300 items-center justify-center py-safe">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!book) {
    return (
      <Box className="flex-1 bg-background-300 py-safe p-6">
        <BackButton />
        <Text className="text-center mt-10">{i18n.t("bookDetail.bookNotFound")}</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack space="lg" className="p-6">
          <BackButton />

          {/* Cover */}
          <Box className="items-center">
            <Box
              className="rounded-lg overflow-hidden"
              style={{ width: 240, height: 360 }}
            >
              {book.coverUri ? (
                <Image
                  source={{ uri: book.coverUri }}
                  size="full"
                  className="w-full h-full rounded-md"
                  accessibilityLabel="image"
                  alt="Book Cover"
                  resizeMode="contain"
                />
              ) : (
                <Box className="w-full h-full bg-background-200 items-center justify-center">
                  <Text className="text-typography-400">{i18n.t("bookDetail.noCover")}</Text>
                </Box>
              )}
            </Box>
          </Box>

          {/* Title & Author */}
          <VStack space="xs" className="items-center">
            <Heading size="2xl" className="text-center">
              {book.title}
            </Heading>
            <Text size="lg" className="text-typography-600 text-center">
              {book.author}
            </Text>
          </VStack>

          {/* Rating */}
          <VStack space="xs" className="items-center">
            <Text size="sm" className="text-typography-500">
              {i18n.t("bookDetail.rating")}
            </Text>
            <HStack space="sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="link"
                  size="xl"
                  onPress={() => handleRating(star)}
                  style={{ padding: 8 }}
                >
                  <Star
                    size={36}
                    color={star <= book.rating ? "#f59e0b" : "#9ca3af"}
                    fill={star <= book.rating ? "#f59e0b" : "none"}
                  />
                </Button>
              ))}
            </HStack>
          </VStack>

          {/* Read toggle */}
          <Button
            size="lg"
            variant={book.isRead ? "solid" : "outline"}
            onPress={handleToggleRead}
          >
            <ButtonText>{book.isRead ? i18n.t("bookDetail.readDone") : i18n.t("bookDetail.markAsRead")}</ButtonText>
          </Button>

          {/* Delete */}
          <Button
            size="lg"
            variant="outline"
            action="negative"
            onPress={handleDelete}
          >
            <ButtonIcon as={Trash2} className="mr-2" />
            <ButtonText>{i18n.t("bookDetail.deleteBook")}</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}
