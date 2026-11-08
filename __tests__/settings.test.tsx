import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsProvider, useSettings } from "../components/SettingsContext";
jest.mock("@react-native-async-storage/async-storage", () => ({
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));
let state: ReturnType<typeof useSettings>, root: ReactTestRenderer;
function Consumer() {
  state = useSettings();
  return null;
}
async function mount() {
  await act(async () => {
    root = create(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>,
    );
  });
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  jest.resetAllMocks();
});
test("theme and locale hydrate before interaction and survive another mount", async () => {
  let saved = [
    ["app_locale", "pt"],
    ["app_color_mode", "dark"],
  ];
  jest
    .mocked(AsyncStorage.multiGet)
    .mockImplementation(async () => saved as any);
  jest.mocked(AsyncStorage.multiSet).mockImplementation(async (values) => {
    saved = values.map((pair) => [...pair]);
  });
  await mount();
  expect(state.colorMode).toBe("dark");
  expect(state.locale).toBe("pt");
  await act(async () => {
    state.toggleColorMode();
    state.setLocale("en");
  });
  await act(async () => root.unmount());
  await mount();
  expect(state.colorMode).toBe("light");
  expect(state.locale).toBe("en");
});
test("storage failure releases hydration and exposes a retry", async () => {
  jest
    .mocked(AsyncStorage.multiGet)
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockResolvedValueOnce([
      ["app_locale", "pt"],
      ["app_color_mode", "dark"],
    ]);
  jest.mocked(AsyncStorage.multiSet).mockResolvedValue();
  await mount();
  expect(state.storageError).toBe(true);
  await act(async () => state.retryStorage());
  expect(state.storageError).toBe(false);
  expect(state.colorMode).toBe("dark");
  expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
});
