import {Book} from "@/db/schema";
import i18n from "@/i18n";
import React, {useEffect, useRef, useState} from "react";
import {TouchableOpacity, View} from "react-native";
import {SearchIcon} from "@/components/ui/icon";
import {Input, InputField, InputIcon, InputSlot} from "@/components/ui/input";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";

interface SearchBarProps {
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  value?: string;
  onSearch?: (query: string) => void;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  suggestions?: Book[];
  onSuggestionSelect?: (book: Book) => void;
}

export function SearchBar({
  trailing,
  leading,
  value,
  onSearch,
  onChangeText,
  onBlur,
  suggestions,
  onSuggestionSelect,
}: SearchBarProps) {
  const [query, setQuery] = useState<string>(value ?? "");
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    onChangeText?.(text);
  };

  return (
    <Box className="w-full px-4 pt-2 flex-row items-center" style={{gap: 8}}>
      {leading}
      <View style={{flex: 1}}>
        <Input
          size="lg"
          variant="outline"
          className="rounded-xl border-outline-300 bg-background-0"
        >
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            placeholder={i18n.t("search.placeholder")}
            value={query}
            onChangeText={handleChangeText}
            returnKeyType="search"
            onSubmitEditing={() => {
              const trimmed = query.trim();
              if (onSearch && trimmed !== "") onSearch(trimmed);
            }}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => onBlur?.(), 150);
            }}
          />
        </Input>
        {suggestions && suggestions.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 999,
              elevation: 10,
              backgroundColor: "#ffffff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.12,
              shadowRadius: 8,
              maxHeight: 280,
              overflow: "hidden",
            }}
          >
            {suggestions.map((book, idx) => (
              <TouchableOpacity
                key={book.id}
                onPress={() => {
                  if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                  onSuggestionSelect?.(book);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: "#f3f4f6",
                }}
              >
                <Text className="text-typography-900 font-medium" numberOfLines={1}>
                  {book.title}
                </Text>
                <Text className="text-typography-400 text-sm" numberOfLines={1}>
                  {book.author}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {trailing}
    </Box>
  );
}
