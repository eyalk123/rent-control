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
  // The label on a form field. Not textSecondary: at label size that measures APCA Lc 74
  // against a card, where 14px/500 wants ~94, and in an empty dropdown the label is doing
  // real work. Lc 91.5 / 9.33:1 here, still a clear step below textPrimary (Lc 100) so the
  // value stays the darkest thing in the field.
  fieldLabel: "#3A4760",
  // A placeholder sits below the label on purpose - Lc 80 against the label's 91 and the
  // value's 100. The old #A8AFBA measured 2.21:1 on white and Lc 44.
  placeholder: "#5A6372",

  // Inputs
  inputBackground: "#FFFFFF",
  inputFilledBackground: "#F6F3EC", // lighter, slightly cooler — distinct from card bg
  // The resting outline of a field. WCAG 1.4.11 asks 3:1 for the boundary of a control, and
  // an unfilled field has nothing else to mark its edge: 3.07:1 on a card, 3.02:1 on cream.
  // The old 0.18 measured 1.33:1 and the fields read as smudges.
  inputBorder: "rgba(26,45,74,0.51)",
  // Focus. Navy at full strength is 11.5:1 on a card and 3.75:1 against the resting outline,
  // so the ring reads as a state change and not just a darker line.
  inputBorderFocus: "#1E3A5F",

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

  // P&L card backgrounds
  plPositiveBg: "#1F7A60",
  plNegativeBg: "#9A3412",
  plNeutralBg: "#5A6472",

  // Avatar initials
  avatarBackground: "#EDF0F4",
  avatarBorder: "#D2D8E0",
  avatarText: "#1E3A5F",
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
  // Reverse polarity caps what is reachable here: even full cream is only Lc 92, so the
  // label sits near the top of the range at 0.90 (Lc 80) rather than mid-way. At the old
  // 0.66 a field label measured Lc 52 - the worst legibility regression in either theme.
  fieldLabel: "rgba(241,236,223,0.90)",
  placeholder: "rgba(241,236,223,0.70)",

  // Inputs
  inputBackground: "#172A44",
  inputFilledBackground: "#1F3556",
  // 3.04:1 on a card, 3.17:1 on the page. The old 0.20 measured 2.06:1 — and nothing used
  // this token anyway; the fields were drawing themselves with `outline` at 1.63:1.
  inputBorder: "rgba(241,236,223,0.38)",
  // Not `primary`: #3E6FA8 on the dark card is 2.79:1, under the 3:1 a focus ring owes. This
  // is 5.30:1 and clearly brighter than the resting grey outline.
  inputBorderFocus: "#6BA0DC",

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

  // P&L card backgrounds
  plPositiveBg: "#1F7A60",
  plNegativeBg: "#7A3020",
  plNeutralBg: "#3A3A3A",

  // Avatar initials
  avatarBackground: "#2A3950",
  avatarBorder: "#41506A",
  avatarText: "#FAF7F0",
} as const;
