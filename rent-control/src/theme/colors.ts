/**
 * Design tokens for rent-control app.
 * Light and dark palettes support theme switching.
 */

export const lightColors = {
  primary: '#2563EB',
  background: '#F8F8F8',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  inputBackground: '#F3F4F6',
  inputFilledBackground: '#F0F4F8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  outline: '#E5E7EB',
} as const;

export const darkColors = {
  primary: '#2563EB',
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  placeholder: '#6B7280',
  inputBackground: '#2D2D2D',
  inputFilledBackground: '#2D2D2D',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  outline: '#374151',
} as const;
