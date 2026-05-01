/**
 * Design tokens for rent-control app — "Landlord Ink" palette.
 * Navy + cream + mustard. Light and dark palettes support theme switching.
 *
 * Token contract: every consumer reads from `colors.<token>`. Token names are
 * stable across themes; only their values change between light and dark.
 *
 * `chooseRevenue*` / `chooseExpense*` are kept as aliases of `rev*` / `exp*`
 * so the existing add-transaction choose buttons keep working untouched.
 */

export const lightColors = {
  // Brand
  primary: "#1E3A5F", // navy
  onPrimary: "#FFFFFF",
  secondary: "#D4A24C", // mustard accent (used as MD3 secondary)
  accent: "#D4A24C",
  accentFg: "#FFFFFF",

  // Surfaces
  background: "#FAF7F0", // cream — the headline change
  surface: "#FFFFFF",
  cardBackground: "#FFFFFF",

  // Text
  textPrimary: "#1A2D4A",
  textSecondary: "#6B7280",
  placeholder: "#A8AFBA",

  // Inputs
  inputBackground: "#FFFFFF",
  inputFilledBackground: "#F6F3EC", // lighter, slightly cooler — distinct from card bg
  inputBorder: "rgba(26,45,74,0.18)",

  // Lines / shadows
  outline: "rgba(26,45,74,0.10)",
  subtleOutline: "rgba(26,45,74,0.05)",

  // Semantic states
  success: "#0F766E",
  warning: "#D4A24C",
  error: "#9A3412",

  // Section accent (legacy)
  sectionAccent: "#D4A24C",

  // Revenue / expense — semantic encoding for transactions UI
  revBg: "rgba(15,118,110,0.12)",
  revFg: "#0F766E",
  expBg: "rgba(180,83,9,0.13)",
  expFg: "#9A3412",

  // Aliases for back-compat with existing add-transaction screens
  chooseRevenueBg: "rgba(15,118,110,0.12)",
  chooseRevenueIcon: "#0F766E",
  chooseExpenseBg: "rgba(180,83,9,0.13)",
  chooseExpenseIcon: "#9A3412",
} as const;


export const darkColors = {
  // Brand
  primary: "#3E6FA8", // lighter navy for dark surfaces
  onPrimary: "#FFFFFF",
  secondary: "#C29543", // slightly muted mustard
  accent: "#C29543",
  accentFg: "#1A2D4A", // dark text on mustard for AA contrast

  // Surfaces — deep warm navy instead of pure black
  background: "#0F1B2D",
  surface: "#172A44",
  cardBackground: "#172A44",
  surfaceElevated: "#1F3556",
  surfaceOverlay: "rgba(241,236,223,0.06)",

  // Text — warm cream tone instead of cold white
  textPrimary: "#F1ECDF",
  textSecondary: "rgba(241,236,223,0.66)",
  textDisabled: "rgba(241,236,223,0.38)",
  placeholder: "rgba(241,236,223,0.45)",

  // Inputs
  inputBackground: "#172A44",
  inputFilledBackground: "#1F3556",
  inputBorder: "rgba(241,236,223,0.20)",

  // Lines
  outline: "rgba(241,236,223,0.12)",
  outlineSubtle: "rgba(241,236,223,0.08)",
  subtleOutline: "rgba(241,236,223,0.06)",

  // Semantic states
  success: "#34A39A",
  warning: "#E2B26A",
  error: "#D87559",

  // Section accent
  sectionAccent: "#C29543",

  // Revenue / expense — lighter variants for dark navy surfaces
  revBg: "rgba(52,163,154,0.18)",
  revFg: "#34A39A",
  expBg: "rgba(216,117,89,0.18)",
  expFg: "#D87559",

  // Aliases
  chooseRevenueBg: "rgba(52,163,154,0.18)",
  chooseRevenueIcon: "#34A39A",
  chooseExpenseBg: "rgba(216,117,89,0.18)",
  chooseExpenseIcon: "#D87559",
} as const;
