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
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import i18n from "@/i18n";

export default function AddBook() {
  const db = useDatabase();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(i18n.t("addBook.validation"), i18n.t("addBook.titleRequired"));
      return;
    }
    if (!author.trim()) {
      Alert.alert(i18n.t("addBook.validation"), i18n.t("addBook.authorRequired"));
      return;
    }

    setSaving(true);
    try {
      await addBook(db, { title: title.trim(), author: author.trim(), coverUri });
      router.back();
    } catch (e: any) {
      Alert.alert(i18n.t("addBook.error"), e.message ?? i18n.t("addBook.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <VStack space="lg" className="p-6">
          <BackButton />
          <Heading size="2xl">{i18n.t("addBook.title")}</Heading>

          <VStack space="xs">
            <Heading size="sm">{i18n.t("addBook.coverImage")}</Heading>
            <Pressable
              onPress={pickImage}
              className="items-center justify-center rounded-lg border-2 border-dashed border-outline-300 bg-background-100"
              style={{ height: 200, width: 140, alignSelf: "center" }}
            >
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  alt="Cover preview"
                  style={{ width: 140, height: 200, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-typography-500 text-center">{i18n.t("addBook.tapToSelect")}</Text>
              )}
            </Pressable>
          </VStack>

          <VStack space="xs">
            <Heading size="sm">{i18n.t("addBook.bookTitle")}</Heading>
            <Input size="lg">
              <InputField
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
                placeholder={i18n.t("addBook.authorPlaceholder")}
                value={author}
                onChangeText={setAuthor}
              />
            </Input>
          </VStack>

          <Button size="lg" onPress={handleSave} isDisabled={saving}>
            <ButtonText>{saving ? i18n.t("addBook.saving") : i18n.t("addBook.saveBook")}</ButtonText>
          </Button>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
}
