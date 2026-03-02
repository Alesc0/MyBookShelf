import {BackButton} from "@/components/BackButton";
import {Box} from "@/components/ui/box";
import {Button, ButtonText} from "@/components/ui/button";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Spinner} from "@/components/ui/spinner";
import {Text} from "@/components/ui/text";
import {VStack} from "@/components/ui/vstack";
import {addBook} from "@/db/books";
import {useDatabase} from "@/db/DrizzleProvider";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {Alert, FlatList, Pressable, ScrollView} from "react-native";
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

  const [saving, setSaving] = useState(false);
  const [selectedCover, setSelectedCover] = useState<string | undefined>(
    params.coverUri || undefined,
  );
  const [covers, setCovers] = useState<string[]>([]);
  const [loadingCovers, setLoadingCovers] = useState(false);

  useEffect(() => {
    if (!params.olKey) return;
    setLoadingCovers(true);
    fetch(`https://openlibrary.org${params.olKey}/editions.json?limit=30`)
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<number>();
        for (const edition of data.entries ?? []) {
          for (const id of edition.covers ?? []) {
            if (id > 0) ids.add(id);
          }
        }
        const uris = Array.from(ids).map(
          (id) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
        );
        setCovers(uris);
      })
      .catch(() => { })
      .finally(() => setLoadingCovers(false));
  }, [params.olKey]);

  const handleAddToLibrary = async () => {
    if (!params.title) return;
    setSaving(true);
    try {
      await addBook(db, {
        title: params.title,
        author: params.author ?? i18n.t("olBook.unknownAuthor"),
        coverUri: selectedCover ?? null,
      });
      Alert.alert(
        i18n.t("olBook.added"),
        i18n.t("olBook.addedMessage", {title: params.title}),
        [{text: i18n.t("olBook.ok"), onPress: () => router.back()}],
      );
    } catch (e: any) {
      Alert.alert(i18n.t("olBook.error"), e.message ?? i18n.t("olBook.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <VStack space="lg" className="p-6">
          <BackButton />

          {/* Cover */}
          <Box className="items-center">
            <Box
              className="rounded-lg overflow-hidden"
              style={{width: 200, height: 300}}
            >
              {selectedCover ? (
                <Image
                  source={{uri: selectedCover}}
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
              {params.title}
              {params.year ? ` (${params.year})` : ""}
            </Heading>
            <Text size="lg" className="text-typography-600 text-center">
              {params.author ?? i18n.t("olBook.unknownAuthor")}
            </Text>
          </VStack>

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
                  contentContainerStyle={{gap: 10, paddingVertical: 4}}
                  renderItem={({item: uri}) => {
                    const isSelected = uri === selectedCover;
                    return (
                      <Pressable onPress={() => setSelectedCover(uri)}>
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
                            source={{uri}}
                            size="full"
                            className="w-full h-full"
                            alt="Cover option"
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
