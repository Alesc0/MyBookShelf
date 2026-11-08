import { BackButton } from "@/components/BackButton";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { addBook } from "@/db/books";
import { useDatabase } from "@/db/DrizzleProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Alert } from "@/components/alerts";
import { getCovers } from "@/components/openLibrary";
import i18n from "@/i18n";

export default function OLBookDetail() {
  const db = useDatabase();
  const router = useRouter();
  const params = useLocalSearchParams<{
    title: string;
    author: string;
    coverUri?: string;
    year?: string;
    olKey?: string;
  }>();

  const savingRef = useRef(false);
  const width = Math.min(200, useWindowDimensions().width - 48);
  const [saving, setSaving] = useState(false);
  const [selectedCover, setSelectedCover] = useState<string | undefined>(
    params.coverUri || undefined,
  );
  const [covers, setCovers] = useState<string[]>([]);
  const [loadingCovers, setLoadingCovers] = useState(false);

  const [coverError, setCoverError] = useState(false);
  const [coverAttempt, setCoverAttempt] = useState(0);
  useEffect(() => {
    if (!params.olKey) return;
    const controller = new AbortController();
    let active = true;
    setLoadingCovers(true);
    setCoverError(false);
    getCovers(params.olKey, controller.signal)
      .then((uris) => {
        if (active) setCovers(uris);
      })
      .catch(() => {
        if (active) setCoverError(true);
      })
      .finally(() => {
        if (active) setLoadingCovers(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [params.olKey, coverAttempt]);

  const handleAddToLibrary = async () => {
    if (!params.title || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await addBook(db, {
        title: params.title,
        author: params.author ?? i18n.t("olBook.unknownAuthor"),
        coverUri: selectedCover ?? null,
        workKey: params.olKey ?? null,
      });
      Alert.alert(
        i18n.t("olBook.added"),
        i18n.t("olBook.addedMessage", { title: params.title }),
        [{ text: i18n.t("olBook.ok"), onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert(i18n.t("olBook.error"), i18n.t("olBook.addFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack space="lg" className="p-6">
          <BackButton />

          {/* Cover */}
          <Box className="items-center">
            <Box
              className="rounded-lg overflow-hidden"
              style={{ width, height: width * 1.5 }}
            >
              {selectedCover ? (
                <Image
                  source={{ uri: selectedCover }}
                  size="full"
                  className="w-full h-full rounded-md"
                  accessible={false}
                  alt=""
                  resizeMode="contain"
                />
              ) : (
                <Box className="w-full h-full bg-background-200 items-center justify-center">
                  <Text className="text-typography-400">
                    {i18n.t("bookDetail.noCover")}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>

          {/* Title & Author */}
          <VStack space="xs" className="items-center">
            <Heading size="2xl" className="text-center">
              {params.title}
              {params.year ? ` (${params.year})` : ""}
            </Heading>
            <Text size="lg" className="text-typography-600 text-center">
              {params.author ?? i18n.t("olBook.unknownAuthor")}
            </Text>
          </VStack>

          {coverError && (
            <Box>
              <Text accessibilityRole="alert">
                {i18n.t("common.loadError")}
              </Text>
              <Button onPress={() => setCoverAttempt((n) => n + 1)}>
                <ButtonText>{i18n.t("common.retry")}</ButtonText>
              </Button>
            </Box>
          )}
          {/* Other covers */}
          {(loadingCovers || covers.length > 0) && (
            <VStack space="sm">
              <Text className="text-typography-500 font-medium">
                {i18n.t("olBook.otherCovers")}
              </Text>
              {loadingCovers ? (
                <Box className="items-center py-4">
                  <Spinner size="small" />
                </Box>
              ) : (
                <FlatList
                  horizontal
                  data={covers}
                  keyExtractor={(uri) => uri}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                  renderItem={({ item: uri, index }) => {
                    const isSelected = uri === selectedCover;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={i18n.t("olBook.coverOption", {
                          count: index + 1,
                        })}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setSelectedCover(uri)}
                      >
                        <Box
                          style={{
                            width: 80,
                            height: 110,
                            borderRadius: 6,
                            overflow: "hidden",
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: isSelected ? "#6366f1" : "transparent",
                          }}
                        >
                          <Image
                            source={{ uri }}
                            size="full"
                            className="w-full h-full"
                            alt=""
                            accessible={false}
                            resizeMode="cover"
                          />
                        </Box>
                      </Pressable>
                    );
                  }}
                />
              )}
            </VStack>
          )}

          {/* Add to library */}
          <Button size="lg" onPress={handleAddToLibrary} isDisabled={saving}>
            <ButtonText>
              {saving ? i18n.t("olBook.adding") : i18n.t("olBook.addToLibrary")}
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}
