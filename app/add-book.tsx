import { BackButton } from "@/components/BackButton";
import { Button, ButtonText } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { Image } from "@/components/ui/image";
import { addBook } from "@/db/books";
import { useDatabase } from "@/db/DrizzleProvider";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Alert } from "@/components/alerts";
import i18n from "@/i18n";

export default function AddBook() {
  const db = useDatabase();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setCoverUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(i18n.t("addBook.error"), i18n.t("addBook.imageFailed"));
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!title.trim()) {
      Alert.alert(
        i18n.t("addBook.validation"),
        i18n.t("addBook.titleRequired"),
      );
      return;
    }
    if (!author.trim()) {
      Alert.alert(
        i18n.t("addBook.validation"),
        i18n.t("addBook.authorRequired"),
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await addBook(db, {
        title: title.trim(),
        author: author.trim(),
        coverUri,
      });
      router.back();
    } catch (e: any) {
      Alert.alert(i18n.t("addBook.error"), i18n.t("addBook.saveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <VStack space="lg" className="p-6">
            <BackButton />
            <Heading size="2xl">{i18n.t("addBook.title")}</Heading>

            {Platform.OS === "web" && (
              <Text>{i18n.t("addBook.nativeImage")}</Text>
            )}
            <VStack space="xs">
              <Heading size="sm">{i18n.t("addBook.coverImage")}</Heading>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18n.t("addBook.tapToSelect")}
                disabled={Platform.OS === "web" || saving}
                onPress={pickImage}
                className="items-center justify-center rounded-lg border-2 border-dashed border-outline-300 bg-background-100"
                style={{ height: 200, width: 140, alignSelf: "center" }}
              >
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    alt={i18n.t("addBook.coverImage")}
                    style={{ width: 140, height: 200, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-typography-500 text-center">
                    {i18n.t("addBook.tapToSelect")}
                  </Text>
                )}
              </Pressable>
            </VStack>

            <VStack space="xs">
              <Heading size="sm">{i18n.t("addBook.bookTitle")}</Heading>
              <Input size="lg">
                <InputField
                  aria-label={i18n.t("addBook.bookTitle")}
                  accessibilityLabel={i18n.t("addBook.bookTitle")}
                  placeholder={i18n.t("addBook.titlePlaceholder")}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Heading size="sm">{i18n.t("addBook.author")}</Heading>
              <Input size="lg">
                <InputField
                  aria-label={i18n.t("addBook.author")}
                  accessibilityLabel={i18n.t("addBook.author")}
                  placeholder={i18n.t("addBook.authorPlaceholder")}
                  value={author}
                  onChangeText={setAuthor}
                />
              </Input>
            </VStack>

            <Button size="lg" onPress={handleSave} isDisabled={saving}>
              <ButtonText>
                {saving ? i18n.t("addBook.saving") : i18n.t("addBook.saveBook")}
              </ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
