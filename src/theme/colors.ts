/**
 * Design tokens for rent-control app.
 * Light and dark palettes support theme switching.
 * Form-specific tokens for add/edit screens.
 */

export const lightColors = {
  primary: '#1D4ED8',
  secondary: '#0D9488',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  placeholder: '#94A3B8',
  inputBackground: '#F8FAFC',
  inputFilledBackground: '#F1F5F9',
  inputBorder: '#E2E8F0',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  outline: '#E2E8F0',
  /** Card/section background on form screens; slightly off surface for depth */
  cardBackground: '#FFFFFF',
  /** Accent line or highlight for section headers */
  sectionAccent: '#0D9488',
} as const;

export const darkColors = {
  primary: '#3B82F6',
  secondary: '#2DD4BF',
  background: '#0F172A',
  surface: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  placeholder: '#64748B',
  inputBackground: '#334155',
  inputFilledBackground: '#334155',
  inputBorder: '#475569',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F87171',
  outline: '#475569',
  cardBackground: '#1E293B',
  sectionAccent: '#2DD4BF',
} as const;
