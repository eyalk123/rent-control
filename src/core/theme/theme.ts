import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import { darkColors, lightColors } from "./colors";

const roundness = 16;

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    onPrimary: "#FFFFFF",
    primaryContainer: lightColors.primary,
    onPrimaryContainer: "#FFFFFF",
    secondary: lightColors.secondary,
    onSecondary: "#FFFFFF",
    background: lightColors.background,
    onBackground: lightColors.textPrimary,
    surface: lightColors.surface,
    onSurface: lightColors.textPrimary,
    surfaceVariant: lightColors.inputBackground,
    onSurfaceVariant: lightColors.textSecondary,
    outline: lightColors.outline,
    error: lightColors.error,
    onError: "#FFFFFF",
    outlineVariant: lightColors.outline,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    onPrimary: "#FFFFFF",
    primaryContainer: darkColors.primary,
    onPrimaryContainer: "#FFFFFF",
    secondary: darkColors.secondary,
    onSecondary: "#FFFFFF",
    background: darkColors.background,
    onBackground: darkColors.textPrimary,
    surface: darkColors.surface,
    onSurface: darkColors.textPrimary,
    surfaceVariant: darkColors.inputBackground,
    onSurfaceVariant: darkColors.textSecondary,
    outline: darkColors.outline,
    error: darkColors.error,
    onError: "#FFFFFF",
    outlineVariant: darkColors.outlineSubtle,
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
