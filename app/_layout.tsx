import '@/src/core/i18n';
import React, { useEffect } from 'react';
import { View, Platform, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import { ssoUrlStore } from '@/src/core/ssoUrlStore';
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

/** Logs all deep links received by this activity — confirms whether launchMode=singleTask is active. */
function DeepLinkDebug() {
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      console.log('[LINK] initial URL:', url);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      console.log('[LINK] addEventListener fired:', url);
      // Capture SSO callback URLs immediately — before Expo Router processes the
      // URL and potentially strips query params from useLocalSearchParams.
      if (url.includes('sso-callback')) {
        ssoUrlStore.set(url);
        console.log('[LINK] SSO URL captured in store:', url);
      }
    });

    // AppState-based fallback: when the app returns to foreground after OAuth, try to
    // read the deep-link URL. On standard RN builds getInitialURL() returns the new intent;
    // on the Expo dev client it may still return the launch URL — logged either way.
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const url = await Linking.getInitialURL();
        console.log('[LINK] AppState→active, getInitialURL:', url);
        if (url && url.includes('sso-callback') && !ssoUrlStore.get()) {
          ssoUrlStore.set(url);
          console.log('[LINK] SSO URL captured via AppState→getInitialURL:', url);
        }
      }
    });

    return () => {
      linkSub.remove();
      appStateSub.remove();
    };
  }, []);
  return null;
}

function DirectionalContent() {
  const { isRtl } = useLanguageContext();
  return (
    <View style={{ direction: isRtl ? 'rtl' : 'ltr', flex: 1 }}>
      <AuthTokenSync />
      <DeepLinkDebug />
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