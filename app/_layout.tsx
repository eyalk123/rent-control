import '@/src/i18n';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
// 1. Import GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PropertyProvider,
  RenterProvider,
  ThemeProvider,
  useThemeContext,
  LanguageProvider,
  useLanguageContext,
} from '@/src/context';

function DirectionalContent() {
  const { isRtl } = useLanguageContext();
  return (
    <View style={{ direction: isRtl ? 'rtl' : 'ltr', flex: 1 }}>
      <PropertyProvider>
        <RenterProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RenterProvider>
      </PropertyProvider>
    </View>
  );
}

function AppContent() {
  const { theme } = useThemeContext();

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
    // 2. Wrap the entire app and give it a flex: 1 so it fills the screen
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}