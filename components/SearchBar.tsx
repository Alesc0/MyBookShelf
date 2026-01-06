import React, { useEffect, useState } from 'react';
import { SearchIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { router, useLocalSearchParams } from 'expo-router';

export function SearchBar() {
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState<string>(params.query ?? '');

  useEffect(() => {
    if (params.query != null && params.query !== query) {
      setQuery(params.query);
    }
  }, [params.query]);

  return (
    <Input>
      <InputSlot className="pl-3">
        <InputIcon as={SearchIcon} />
      </InputSlot>
      <InputField
        placeholder="Search..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => {
          const trimmed = query.trim();
          if (trimmed === '') return;
          router.push({
            pathname: '/search',
            params: { query: trimmed },
          });
        }}
      />
    </Input>
  );
}