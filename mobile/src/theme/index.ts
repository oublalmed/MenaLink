import { useColorScheme } from 'react-native';

export const COLORS = {
  primary: '#2980B9',
  dark: '#2C3E50',
  success: '#27AE60',
  warning: '#E67E22',
  danger: '#E74C3C',
  gray: '#7F8C8D',
  lightGray: '#F4F6F7',
  white: '#FFFFFF',
  background: '#F0F4F8',
  // dark mode
  darkBg: '#1A1F2E',
  darkCard: '#242B3D',
  darkBorder: '#2E3A4E',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FONT_SIZE = {
  h1: 24,
  h2: 20,
  h3: 17,
  body: 14,
  caption: 12,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type ThemeColors = typeof COLORS;
export type ThemeSpacing = typeof SPACING;
export type ThemeRadius = typeof RADIUS;
export type ThemeFontSize = typeof FONT_SIZE;

export interface Theme {
  colors: {
    primary: string;
    dark: string;
    success: string;
    warning: string;
    danger: string;
    gray: string;
    lightGray: string;
    white: string;
    background: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
  };
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  fontSize: ThemeFontSize;
  isDark: boolean;
}

/**
 * Hook returning the current theme based on system color scheme.
 * Provides colors, spacing, radius, fontSize and isDark flag.
 */
export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: {
      primary: COLORS.primary,
      dark: isDark ? COLORS.white : COLORS.dark,
      success: COLORS.success,
      warning: COLORS.warning,
      danger: COLORS.danger,
      gray: COLORS.gray,
      lightGray: isDark ? COLORS.darkBorder : COLORS.lightGray,
      white: isDark ? COLORS.darkCard : COLORS.white,
      background: isDark ? COLORS.darkBg : COLORS.background,
      card: isDark ? COLORS.darkCard : COLORS.white,
      border: isDark ? COLORS.darkBorder : '#DDE1E7',
      text: isDark ? COLORS.white : COLORS.dark,
      textSecondary: isDark ? '#A0AEC0' : COLORS.gray,
    },
    spacing: SPACING,
    radius: RADIUS,
    fontSize: FONT_SIZE,
    isDark,
  };
}
