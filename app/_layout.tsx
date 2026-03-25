import {
  LanguageProvider,
  ThemeProvider,
  useLanguageContext,
  useThemeContext,
} from "@/src/context";
import { AuthProvider } from "@/src/core/auth/AuthContext";
import "@/src/core/i18n";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
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
  return (
    <View style={{ direction: isRtl ? "rtl" : "ltr", flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

function AppContent() {
  const { theme } = useThemeContext();

  // Inside app/_layout.tsx
  useEffect(() => {
    if (Platform.OS === "android") {
      // 'light' means WHITE icons (for dark theme)
      // 'dark' means BLACK icons (for light theme)
      NavigationBar.setStyle(theme.dark ? "dark" : "light");
    }
  }, [theme.dark]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <LanguageProvider>
        <DirectionalContent />
      </LanguageProvider>
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
});
