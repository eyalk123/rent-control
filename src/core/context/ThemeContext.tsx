import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MD3Theme } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/src/core/theme';
import { appFonts, scaleFontsLineHeight } from '@/src/core/theme/fonts';

const THEME_STORAGE_KEY = 'theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  themeMode: ThemeMode;
  theme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  const { fontScale } = useWindowDimensions();

  const base =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
        ? darkTheme
        : lightTheme
      : themeMode === 'dark'
        ? darkTheme
        : lightTheme;

  // MD3 pins a fixed lineHeight per variant and React Native does not scale it, so large text
  // clips inside its own line box. Rebuilt here rather than at module scope so a change to the
  // system setting re-renders. Identical to `base` at scale 1.
  const resolvedTheme = useMemo(
    () => (fontScale === 1 ? base : { ...base, fonts: scaleFontsLineHeight(appFonts, fontScale) }),
    [base, fontScale],
  );

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({ themeMode, theme: resolvedTheme, setThemeMode }),
    [themeMode, resolvedTheme, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}
