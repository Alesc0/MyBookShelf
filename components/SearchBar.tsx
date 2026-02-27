import React, { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import { Box } from "@/components/ui/box";
import i18n from "@/i18n";

export function SearchBar({ trailing }: { trailing?: React.ReactNode }) {
  const params = useLocalSearchParams<{ query?: string }>();
  const pathname = usePathname();
  const [query, setQuery] = useState<string>(params.query ?? "");

  useEffect(() => {
    if (params.query != null && params.query !== query) {
      setQuery(params.query);
    }
  }, [params.query]);

  return (
    <Box className="w-full px-4 pt-2 flex-row items-center" style={{ gap: 8 }}>
      <Input
        size="lg"
        variant="outline"
        className="rounded-xl border-outline-300 bg-background-0 flex-1"
      >
        <InputSlot className="pl-3">
          <InputIcon as={SearchIcon} />
        </InputSlot>
        <InputField
          placeholder={i18n.t("search.placeholder")}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => {
            const trimmed = query.trim();
            if (trimmed === "") return;
            if (pathname === "/search") {
              router.setParams({ query: trimmed });
            } else {
              router.push({
                pathname: "/search",
                params: { query: trimmed },
              });
            }
          }}
        />
      </Input>
      {trailing}
    </Box>
  );
}
