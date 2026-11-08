import i18n from "@/i18n";
import { useSettings } from "./SettingsContext";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";

export function BackButton() {
  const { colorMode } = useSettings();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={i18n.t("common.back")}
      className="bg-background-0 border-outline-300"
      onPress={() => router.back()}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
      }}
    >
      <ArrowLeft
        size={22}
        color={colorMode === "dark" ? "#e5e7eb" : "#374151"}
      />
    </Pressable>
  );
}
