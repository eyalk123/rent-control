/**
 * Design tokens for rent-control app.
 * Light and dark palettes support theme switching.
 * Form-specific tokens for add/edit screens.
 */

export const lightColors = {
  primary: "rgba(29, 78, 216, 1)",
  secondary: "rgba(13, 148, 136, 1)",
  background: "rgba(241, 245, 249, 1)",
  surface: "rgba(255, 255, 255, 1)",
  textPrimary: "rgba(15, 23, 42, 1)",
  textSecondary: "rgba(100, 116, 139, 1)",
  placeholder: "rgba(148, 163, 184, 1)",
  inputBackground: "rgba(248, 250, 252, 1)",
  // Slightly lighter than `background` for better form contrast
  inputFilledBackground: "rgba(248, 250, 252, 1)",
  inputBorder: "rgba(226, 232, 240, 1)",
  success: "rgba(5, 150, 105, 1)",
  warning: "rgba(217, 119, 6, 1)",
  error: "rgba(220, 38, 38, 1)",
  outline: "rgba(226, 232, 240, 1)",
  /** Card/section background on form screens; slightly off surface for depth */
  cardBackground: "rgba(255, 255, 255, 1)",
  /** Accent line or highlight for section headers */
  sectionAccent: "rgba(13, 148, 136, 1)",
  /** Add-transaction choose buttons: light green/red backgrounds and text */
  chooseRevenueBg: "rgba(5, 150, 105, 0.22)",
  chooseRevenueIcon: "rgba(4, 120, 87, 1)",
  chooseExpenseBg: "rgba(220, 38, 38, 0.22)",
  chooseExpenseIcon: "rgba(185, 28, 28, 1)",
} as const;


export const darkColors = {
  primary: "rgb(40, 136, 226)",
  secondary: "rgb(70, 150, 224)",
  background: "rgba(18, 18, 18, 1)",
  surface: "rgba(30, 30, 32, 1)",
  textPrimary: "rgba(240, 241, 243, 1)",
  textSecondary: "rgba(240, 241, 243, 0.72)",
  placeholder: "rgba(240, 241, 243, 0.55)",
  inputBackground: "rgba(30, 30, 32, 1)",
  // Slightly lighter than `background` for better form contrast
  inputFilledBackground: "rgba(44, 44, 46, 1)",
  inputBorder: "rgba(255, 255, 255, 0.15)",
  success: "rgba(16, 185, 129, 1)",
  warning: "rgba(245, 158, 11, 1)",
  error: "rgba(248, 113, 113, 1)",
  outline: "rgba(255, 255, 255, 0.12)",
  cardBackground: "rgba(30, 30, 32, 1)",
  sectionAccent: "rgba(86, 132, 174, 1)",
  chooseRevenueBg: "rgba(16, 185, 129, 0.18)",
  chooseRevenueIcon: "rgba(52, 211, 153, 1)",
  chooseExpenseBg: "rgba(248, 113, 113, 0.18)",
  chooseExpenseIcon: "rgba(252, 165, 165, 1)",
  /** Elevated surface (modals, FABs) — slightly lighter than surface */
  surfaceElevated: "rgba(44, 44, 46, 1)",
  /** Pressed/hover overlay */
  surfaceOverlay: "rgba(240, 241, 243, 0.06)",
  /** Subtle separator/divider */
  outlineSubtle: "rgba(255, 255, 255, 0.08)",
  /** Disabled text */
  textDisabled: "rgba(240, 241, 243, 0.38)",
} as const;
