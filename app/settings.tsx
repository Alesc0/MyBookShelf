import { BackButton } from "@/components/BackButton";
import { useSettings } from "@/components/SettingsContext";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { exportDatabase, importDatabase } from "@/db/export";
import { Alert } from "@/components/alerts";
import i18n from "@/i18n";
import { useDatabaseStore } from "@/db/DrizzleProvider";
import Constants from "expo-constants";
import { Download, Moon, Sun, Upload } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Platform, ScrollView } from "react-native";

export default function Settings() {
  const {
    colorMode,
    toggleColorMode,
    locale,
    setLocale,
    storageError,
    retryStorage,
  } = useSettings();
  const { connection, reload } = useDatabaseStore();
  const busy = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    if (busy.current) return;
    Alert.alert(
      i18n.t("settings.importConfirmTitle"),
      i18n.t("settings.importConfirmMessage"),
      [
        { text: i18n.t("bookDetail.cancel"), style: "cancel" },
        {
          text: i18n.t("settings.importConfirmButton"),
          style: "destructive",
          onPress: async () => {
            if (busy.current) return;
            busy.current = true;
            setImporting(true);
            try {
              const picked = await importDatabase(connection, reload);
              if (picked) {
                Alert.alert(
                  i18n.t("settings.importSuccess"),
                  i18n.t("settings.importSuccessMessage"),
                );
              }
            } catch (error) {
              Alert.alert(
                i18n.t("settings.importError"),
                i18n.t("settings.importErrorMessage"),
              );
              console.log(error);
            } finally {
              busy.current = false;
              setImporting(false);
            }
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    if (busy.current) return;
    busy.current = true;
    setExporting(true);
    try {
      await exportDatabase(connection);
    } catch (error) {
      Alert.alert(
        i18n.t("settings.exportError"),
        i18n.t("settings.exportErrorMessage"),
      );
      console.log(error);
    } finally {
      busy.current = false;
      setExporting(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-300 py-safe">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack space="xl" className="p-6">
          <BackButton />
          <Heading size="2xl">{i18n.t("settings.title")}</Heading>

          {storageError && (
            <Box>
              <Text accessibilityRole="alert">
                {i18n.t("settings.storageError")}
              </Text>
              <Button onPress={retryStorage}>
                <ButtonText>{i18n.t("common.retry")}</ButtonText>
              </Button>
            </Box>
          )}
          {/* Appearance */}
          <VStack space="md">
            <Heading size="lg">{i18n.t("settings.appearance")}</Heading>
            <HStack className="items-center justify-between bg-background-0 rounded-xl p-4">
              <HStack space="md" className="items-center">
                {colorMode === "dark" ? (
                  <Moon size={22} color="#6b7280" />
                ) : (
                  <Sun size={22} color="#f59e0b" />
                )}
                <Text size="lg">{i18n.t("settings.darkMode")}</Text>
              </HStack>
              <Switch
                accessibilityLabel={i18n.t("settings.darkMode")}
                value={colorMode === "dark"}
                onValueChange={toggleColorMode}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Language */}
          <VStack space="md">
            <Heading size="lg">{i18n.t("settings.language")}</Heading>
            <VStack space="sm">
              <Button
                size="lg"
                variant={locale === "en" ? "solid" : "outline"}
                onPress={() => setLocale("en")}
                className="justify-start"
              >
                <ButtonText>🇬🇧 {i18n.t("settings.english")}</ButtonText>
              </Button>
              <Button
                size="lg"
                variant={locale === "pt" ? "solid" : "outline"}
                onPress={() => setLocale("pt")}
                className="justify-start"
              >
                <ButtonText>🇵🇹 {i18n.t("settings.portuguese")}</ButtonText>
              </Button>
            </VStack>
          </VStack>

          <Divider />

          {/* Data */}
          <VStack space="md">
            <Heading size="lg">{i18n.t("settings.data")}</Heading>
            {Platform.OS === "web" && (
              <Text>{i18n.t("settings.nativeBackup")}</Text>
            )}
            <VStack space="sm" className="bg-background-0 rounded-xl p-4">
              <Text size="sm" className="text-typography-500">
                {i18n.t("settings.exportDescription")}
              </Text>
              <HStack space="sm">
                <Button
                  size="lg"
                  variant="outline"
                  onPress={handleExport}
                  isDisabled={exporting || importing || Platform.OS === "web"}
                  className="flex-1"
                >
                  <Download size={18} color="#6b7280" />
                  <ButtonText className="ml-2">
                    {exporting ? "..." : i18n.t("settings.export")}
                  </ButtonText>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onPress={handleImport}
                  isDisabled={exporting || importing || Platform.OS === "web"}
                  className="flex-1"
                >
                  <Upload size={18} color="#6b7280" />
                  <ButtonText className="ml-2">
                    {importing ? "..." : i18n.t("settings.import")}
                  </ButtonText>
                </Button>
              </HStack>
            </VStack>
          </VStack>

          <Divider />

          {/* About */}
          <VStack space="md">
            <Heading size="lg">{i18n.t("settings.about")}</Heading>
            <Box className="bg-background-0 rounded-xl p-4">
              <HStack className="items-center justify-between">
                <Text size="lg">{i18n.t("settings.appName")}</Text>
                <Text size="sm" className="text-typography-500">
                  {i18n.t("settings.version")} {Constants.expoConfig?.version}
                </Text>
              </HStack>
            </Box>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
