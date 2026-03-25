import '@/src/core/i18n';
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/src/core/auth/AuthContext';
import {
  ThemeProvider,
  useThemeContext,
  LanguageProvider,
  useLanguageContext,
} from '@/src/context';

function DirectionalContent() {
  const { isRtl } = useLanguageContext();
  return (
    <View style={{ direction: isRtl ? 'rtl' : 'ltr', flex: 1 }}>
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
}
