import i18n from "@/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActivityIndicator } from "react-native";
type ColorMode = "light" | "dark";
type Locale = "en" | "pt";
type Settings = {
  colorMode: ColorMode;
  locale: Locale;
  toggleColorMode: () => void;
  setLocale: (locale: Locale) => void;
  storageError: boolean;
  retryStorage: () => void;
};
const Context = createContext<Settings | null>(null);
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [locale, setLocaleState] = useState<Locale>(
    i18n.locale.startsWith("pt") ? "pt" : "en",
  );
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const readFailed = useRef(false);
  const [retry, setRetry] = useState(0);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(["app_locale", "app_color_mode"])
      .then((values) => {
        if (!active) return;
        readFailed.current = false;
        setStorageError(false);
        const saved = Object.fromEntries(values);
        if (saved.app_locale === "en" || saved.app_locale === "pt") {
          i18n.locale = saved.app_locale;
          setLocaleState(saved.app_locale);
        }
        if (saved.app_color_mode === "light" || saved.app_color_mode === "dark")
          setColorMode(saved.app_color_mode);
      })
      .catch(() => {
        if (active) {
          readFailed.current = true;
          setStorageError(true);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  // Serialize preference writes so a slow earlier write cannot win after a newer one.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    let active = true;
    queue.current = queue.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.multiSet([
          ["app_locale", locale],
          ["app_color_mode", colorMode],
        ]),
      );
    queue.current
      .then(() => {
        if (active) {
          readFailed.current = false;
          setStorageError(false);
        }
      })
      .catch(() => {
        if (active) setStorageError(true);
      });
    return () => {
      active = false;
    };
  }, [colorMode, locale, ready, retry]);
  const toggleColorMode = useCallback(
    () => setColorMode((prev) => (prev === "light" ? "dark" : "light")),
    [],
  );
  const setLocale = useCallback((value: Locale) => {
    i18n.locale = value;
    setLocaleState(value);
  }, []);
  if (!ready) return <ActivityIndicator size="large" />;
  return (
    <Context.Provider
      value={{
        colorMode,
        locale,
        toggleColorMode,
        setLocale,
        storageError,
        retryStorage: () => {
          if (readFailed.current) {
            hydrated.current = false;
            setReady(false);
            setLoadAttempt((n) => n + 1);
          } else setRetry((n) => n + 1);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSettings() {
  const context = useContext(Context);
  if (!context) throw new Error("Settings are not ready");
  return context;
}
