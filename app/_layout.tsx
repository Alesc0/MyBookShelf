import {SettingsProvider, useSettings} from "@/components/SettingsContext";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import {DrizzleProvider} from "@/db/DrizzleProvider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {useFonts} from "expo-font";
import {Slot, usePathname} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {useEffect} from "react";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <SettingsProvider>
      <RootLayoutInner />
    </SettingsProvider>
  );
}

function RootLayoutInner() {
  const {colorMode} = useSettings();
  const pathname = usePathname();

  return (
    <GluestackUIProvider mode={colorMode}>
      <ThemeProvider value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
        <DrizzleProvider>
          <Slot />
        </DrizzleProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
