import { SearchIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { router } from 'expo-router';
import { setParams } from 'expo-router/build/global-state/routing';

export function SearchBar() {
  return (
    <Input>
      <InputSlot className="pl-3">
        <InputIcon as={SearchIcon} />
      </InputSlot>
      <InputField
        placeholder="Search..."
        onSubmitEditing={(e) => {
          const text = e.nativeEvent?.text ?? '';
          const trimmed = text.trim();
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