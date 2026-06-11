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
import { NotificationProvider } from "@/src/features/notifications/context/NotificationContext";
import "@/src/core/i18n";
import * as NavigationBar from "expo-navigation-bar";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";

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
                <DirectionalContent />
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

  useEffect(() => {
    if (ref?.current) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);

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
