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
} as const;

export type ColorKey = keyof typeof COLORS;
