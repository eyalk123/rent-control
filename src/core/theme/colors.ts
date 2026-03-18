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
  inputFilledBackground: "rgba(241, 245, 249, 1)",
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
  primary: "rgba(59, 130, 246, 1)",
  secondary: "rgba(45, 212, 191, 1)",
  background: "rgba(15, 23, 42, 1)",
  surface: "rgba(30, 41, 59, 1)",
  textPrimary: "rgba(248, 250, 252, 1)",
  textSecondary: "rgba(148, 163, 184, 1)",
  placeholder: "rgba(100, 116, 139, 1)",
  inputBackground: "rgba(51, 65, 85, 1)",
  inputFilledBackground: "rgba(51, 65, 85, 1)",
  inputBorder: "rgba(71, 85, 105, 1)",
  success: "rgba(16, 185, 129, 1)",
  warning: "rgba(245, 158, 11, 1)",
  error: "rgba(248, 113, 113, 1)",
  outline: "rgba(71, 85, 105, 1)",
  cardBackground: "rgba(30, 41, 59, 1)",
  sectionAccent: "rgba(45, 212, 191, 1)",
  chooseRevenueBg: "rgba(16, 185, 129, 0.28)",
  chooseRevenueIcon: "rgba(52, 211, 153, 1)",
  chooseExpenseBg: "rgba(248, 113, 113, 0.28)",
  chooseExpenseIcon: "rgba(252, 165, 165, 1)",
} as const;
