import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";

export function BackButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.back()}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#ffffff",
      }}
    >
      <ArrowLeft size={22} color="#374151" />
    </Pressable>
  );
}
