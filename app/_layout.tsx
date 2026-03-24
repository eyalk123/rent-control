import '@/src/core/i18n';
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import {
  ThemeProvider,
  useThemeContext,
  LanguageProvider,
  useLanguageContext,
} from '@/src/context';
import { setAuthTokenGetter } from '@/src/core/api/client';

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

/** Registers the Clerk token getter with the API client so every request gets a Bearer header. */
function AuthTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

function DirectionalContent() {
  const { isRtl } = useLanguageContext();
  return (
    <View style={{ direction: isRtl ? 'rtl' : 'ltr', flex: 1 }}>
      <AuthTokenSync />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

function AppContent() {
  const { theme } = useThemeContext();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(theme.colors.background);
      NavigationBar.setStyle(theme.dark ? 'light' : 'dark');
    }
  }, [theme.dark, theme.colors.background]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <LanguageProvider>
        <DirectionalContent />
      </LanguageProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}