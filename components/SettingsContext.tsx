import i18n from "@/i18n";
import React, { createContext, useCallback, useContext, useState } from "react";

type ColorMode = "light" | "dark";
type Locale = "en" | "pt";

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
    i18n.locale.startsWith("pt") ? "pt" : "en"
  );

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);
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
