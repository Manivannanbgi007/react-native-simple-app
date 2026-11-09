/**
 * Shared design values. Screens and components import these instead of
 * repeating hex codes and numbers, so the whole app stays visually consistent.
 */

export const colors = {
  primary: '#4F46E5',
  primaryPressed: '#4338CA',
  primaryLight: '#EEF2FF',

  background: '#F3F4F6',
  surface: '#FFFFFF',
  border: '#E5E7EB',

  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#047857',
  successLight: '#D1FAE5',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  info: '#1D4ED8',
  infoLight: '#DBEAFE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  round: 999,
} as const;
