import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import { darkColors, lightColors } from "./colors";

const roundness = 16;

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    onPrimary: lightColors.onPrimary,
    primaryContainer: "rgba(30,58,95,0.12)",
    onPrimaryContainer: lightColors.primary,
    secondary: lightColors.secondary,
    onSecondary: lightColors.accentFg,
    secondaryContainer: "rgba(212,162,76,0.18)",
    onSecondaryContainer: lightColors.textPrimary,
    background: lightColors.background,
    onBackground: lightColors.textPrimary,
    surface: lightColors.surface,
    onSurface: lightColors.textPrimary,
    surfaceVariant: lightColors.inputFilledBackground,
    onSurfaceVariant: lightColors.textSecondary,
    outline: lightColors.outline,
    outlineVariant: lightColors.subtleOutline,
    error: lightColors.error,
    onError: "#FFFFFF",
    errorContainer: "rgba(154,52,18,0.13)",
    onErrorContainer: lightColors.error,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    onPrimary: darkColors.onPrimary,
    primaryContainer: "rgba(62,111,168,0.20)",
    onPrimaryContainer: darkColors.textPrimary,
    secondary: darkColors.secondary,
    onSecondary: darkColors.accentFg,
    secondaryContainer: "rgba(194,149,67,0.22)",
    onSecondaryContainer: darkColors.textPrimary,
    background: darkColors.background,
    onBackground: darkColors.textPrimary,
    surface: darkColors.surface,
    onSurface: darkColors.textPrimary,
    surfaceVariant: darkColors.inputFilledBackground,
    onSurfaceVariant: darkColors.textSecondary,
    outline: darkColors.outline,
    outlineVariant: darkColors.outlineSubtle,
    error: darkColors.error,
    onError: "#FFFFFF",
    errorContainer: "rgba(216,117,89,0.20)",
    onErrorContainer: darkColors.error,
    elevation: {
      level0: "transparent",
      level1: darkColors.surface,
      level2: darkColors.cardBackground,
      level3: darkColors.surfaceElevated,
      level4: darkColors.surfaceElevated,
      level5: darkColors.surfaceElevated,
    },
  },
};
