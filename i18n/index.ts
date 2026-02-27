import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import en from "./en.json";
import pt from "./pt.json";

const i18n = new I18n({ en, pt });

const deviceLocale = getLocales()[0]?.languageCode ?? "en";
i18n.locale = deviceLocale;
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;
