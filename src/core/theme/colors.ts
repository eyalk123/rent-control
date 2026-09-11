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

  // A mustard wash behind an icon, badge or active row. A token because it was hardcoded
  // as rgba() at four different alphas across seven files.
  accentBg: "rgba(212,162,76,0.14)",
  primaryBg: "rgba(30,58,95,0.10)",

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
  // MD3's dark convention is a *light* primary with a *dark* onPrimary. This palette had the
  // light-theme convention (mid-dark primary + white text) applied to dark mode instead, which
  // is why #3E6FA8 sat 2.4deg from the hue of its own card at 2.79:1 - invisible as an accent,
  // and under the 4.5:1 it owes as text at 70 of its 90 call sites. Now 5.90:1, APCA Lc 50.
  primary: "#65ACE2",
  onPrimary: "#111D2C", // 6.92:1 on primary
  secondary: "#C29543", // mustard, unchanged - 5.29:1 on the new card
  accent: "#C29543",
  accentFg: "#1A2D4A", // dark text on mustard for AA contrast

  // Surfaces - a navy-cast charcoal, not a navy.
  // These were 50% saturation. That is ~2x the most heavily tinted dark theme anyone ships
  // (GitHub's canvas is 21.4% at the same 216deg hue), and it left 94.9% of the Transactions
  // screen's pixels inside a single 15deg blue bucket with only 1.3% neutral. Same hue, same
  // brand; saturation pulled back to ~22%.
  background: "#141921",
  surface: "#222A35",
  cardBackground: "#222A35",
  surfaceElevated: "#2F3846",
  surfaceOverlay: "rgba(239,238,235,0.06)",

  // Text - off-white holding a warm cast, rather than cream.
  // #F1ECDF was 39% saturation at hue 43 sitting on a 215deg ground: near-complementary, which
  // is what made it read faintly sepia. 11% keeps the warmth as a signature without the yellow.
  textPrimary: "#EFEEEB",
  textSecondary: "rgba(239,238,235,0.66)", // 6.28:1
  textDisabled: "rgba(239,238,235,0.38)",
  // Reverse polarity caps what is reachable here, so the label sits near the top of the range
  // at 0.90 rather than mid-way. At the old 0.66 a field label measured Lc 52.
  fieldLabel: "rgba(239,238,235,0.90)", // 10.35:1
  placeholder: "rgba(239,238,235,0.70)", // 6.88:1

  // Inputs
  inputBackground: "#222A35",
  inputFilledBackground: "#2F3846",
  inputBorder: "rgba(239,238,235,0.38)", // 3.08:1 - WCAG 1.4.11 for a control boundary
  inputBorderFocus: "#86BEEA", // 7.28:1, and a clear step lighter than primary

  // Lines
  outline: "rgba(239,238,235,0.12)",
  outlineSubtle: "rgba(239,238,235,0.08)",
  subtleOutline: "rgba(239,238,235,0.06)",

  // Semantic states - kept in step with revFg/expFg below
  success: "#56D2B9",
  warning: "#E8BD73", // 8.24:1
  error: "#F4A590",

  // 0.28, not the 0.15/0.18 these sites hardcoded. That alpha was tuned against a 50%%-
  // saturated navy, where the blue ground did most of the work; over the charcoal the
  // mustard and the ground cancel to a flat grey (measured hue 60, sat 2.7%%). 0.28
  // reproduces the 16.2%% chroma the old pairing gave, warm this time.
  accentBg: "rgba(194,149,67,0.28)",
  primaryBg: "rgba(101,172,226,0.18)",

  // Section accent
  sectionAccent: "#C29543",

  // Revenue / expense.
  // On a screen whose whole job is the sign of a number, this colour carries the meaning, and
  // it measured APCA Lc 41 / 39 - roughly the floor for large text, at a 15px size. Now Lc 64
  // and Lc 61, at 7.80:1 and 7.33:1 on the card.
  revBg: "rgba(86,210,185,0.18)",
  revFg: "#56D2B9",
  expBg: "rgba(244,165,144,0.18)",
  expFg: "#F4A590",

  // Aliases
  chooseRevenueBg: "rgba(86,210,185,0.18)",
  chooseRevenueIcon: "#56D2B9",
  chooseExpenseBg: "rgba(244,165,144,0.18)",
  chooseExpenseIcon: "#F4A590",

  // P&L card backgrounds - solid tiles that carry their own light text, independent of surface
  plPositiveBg: "#1F7A60",
  plNegativeBg: "#7A3020",
  plNeutralBg: "#353C46", // was #3A3A3A - a 0% grey reads brown against a blue-cast page

  // Avatar initials - desaturated in step with the surfaces
  avatarBackground: "#354050",
  avatarBorder: "#4F5E72",
  avatarText: "#EFEEEB",
} as const;
