import { configureFonts } from "react-native-paper";

/**
 * Rubik carries full Hebrew + Latin coverage in every weight, so a single
 * family serves both languages. Each weight is registered by Expo under its
 * own font-family name (loaded in app/_layout.tsx via useFonts).
 */
const RUBIK = {
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  semibold: "Rubik_600SemiBold",
  bold: "Rubik_700Bold",
  black: "Rubik_900Black",
} as const;

/** Monospace family for numeric/data fields (bank accounts, IDs). */
export const MONO_FONT = "IBMPlexMono_400Regular";

// Which Rubik weight backs each MD3 type-scale variant. Hierarchy is carried
// by weight (900 → 700 → 600 → 500 → 400) rather than a second typeface, so
// Hebrew and English headings stay visually matched.
const variantFamily: Record<string, string> = {
  displayLarge: RUBIK.black,
  displayMedium: RUBIK.bold,
  displaySmall: RUBIK.bold,
  headlineLarge: RUBIK.bold,
  headlineMedium: RUBIK.bold,
  headlineSmall: RUBIK.semibold,
  titleLarge: RUBIK.semibold,
  titleMedium: RUBIK.medium,
  titleSmall: RUBIK.medium,
  labelLarge: RUBIK.medium,
  labelMedium: RUBIK.medium,
  labelSmall: RUBIK.medium,
  bodyLarge: RUBIK.regular,
  bodyMedium: RUBIK.regular,
  bodySmall: RUBIK.regular,
};

// Each weight already lives in its own font-family name, so we pin fontWeight
// to "normal" to stop any platform from synthesizing a faux-bold on top.
// configureFonts deep-merges these onto the MD3 defaults, keeping each
// variant's fontSize / lineHeight / letterSpacing intact.
const config = Object.fromEntries(
  Object.entries(variantFamily).map(([variant, fontFamily]) => [
    variant,
    { fontFamily, fontWeight: "normal" as const },
  ])
);

export const appFonts = configureFonts({ config });
