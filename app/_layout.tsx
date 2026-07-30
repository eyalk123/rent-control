import {
  LanguageProvider,
  ThemeProvider,
  useLanguageContext,
  useThemeContext,
  PropertyProvider,
  RenterProvider,
  PaginatedTransactionProvider,
  TransactionSummaryProvider,
} from "@/src/context";
import { AlertProvider } from "@/src/core/context";
import { AuthProvider } from "@/src/core/auth/AuthContext";
import { AgentChatProvider } from "@/src/features/agent/context/AgentChatContext";
import { NotificationProvider } from "@/src/features/notifications/context/NotificationContext";
import "@/src/core/i18n";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_900Black,
} from "@expo-google-fonts/rubik";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";

// Keep the native splash up until icon fonts are loaded so Paper icons
// (MaterialCommunityIcons glyphs) never render blank and "pop in" on first use.
SplashScreen.preventAutoHideAsync();

const routingInstrumentation = Sentry.reactNavigationIntegration();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  integrations: [routingInstrumentation],
  enabled: !__DEV__,
});

function DirectionalContent() {
  const { isRtl } = useLanguageContext();
  const { theme } = useThemeContext();
  return (
    <View style={{ direction: isRtl ? "rtl" : "ltr", flex: 1, backgroundColor: theme.colors.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
    </View>
  );
}

function AppContent() {
  const { theme } = useThemeContext();

  const navigationTheme = useMemo(() => ({
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
    },
  }), [theme.dark, theme.colors.background, theme.colors.surface]);

  // Inside app/_layout.tsx
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setStyle(theme.dark ? "dark" : "light");
    }
  }, [theme.dark]);

  return (
    <PaperProvider theme={theme}>
      <AlertProvider>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <PropertyProvider>
          <RenterProvider>
            <PaginatedTransactionProvider>
            <TransactionSummaryProvider>
              <LanguageProvider>
                <AgentChatProvider>
                  <DirectionalContent />
                </AgentChatProvider>
              </LanguageProvider>
            </TransactionSummaryProvider>
            </PaginatedTransactionProvider>
          </RenterProvider>
        </PropertyProvider>
      </NavigationThemeProvider>
      </AlertProvider>
    </PaperProvider>
  );
}

export default Sentry.wrap(function RootLayout() {
  const ref = useNavigationContainerRef();
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_900Black,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (ref?.current) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </NotificationProvider>
    </AuthProvider>
  );
});
