import i18n from "@/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ColorMode = "light" | "dark";
type Locale = "en" | "pt";

const LOCALE_KEY = "app_locale";

type SettingsContextType = {
  colorMode: ColorMode;
  locale: Locale;
  toggleColorMode: () => void;
  setLocale: (locale: Locale) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  colorMode: "light",
  locale: (i18n.locale.startsWith("pt") ? "pt" : "en") as Locale,
  toggleColorMode: () => {},
  setLocale: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [locale, setLocaleState] = useState<Locale>(
    i18n.locale.startsWith("pt") ? "pt" : "en",
  );

  // Load persisted locale on mount
  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((saved) => {
      if (saved === "en" || saved === "pt") {
        i18n.locale = saved;
        setLocaleState(saved);
      }
    });
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);
    AsyncStorage.setItem(LOCALE_KEY, newLocale);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ colorMode, locale, toggleColorMode, setLocale }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
