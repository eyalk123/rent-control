import '@/src/i18n';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import {
  PropertyProvider,
  RenterProvider,
  ThemeProvider,
  useThemeContext,
  LanguageProvider,
} from '@/src/context';

function AppContent() {
  const { theme } = useThemeContext();

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <LanguageProvider>
        <PropertyProvider>
          <RenterProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </RenterProvider>
        </PropertyProvider>
      </LanguageProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
