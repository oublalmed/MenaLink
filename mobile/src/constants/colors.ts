export const COLORS = {
  primary:    '#E8963A',
  dark:       '#1B3A2D',
  success:    '#27AE60',
  warning:    '#E67E22',
  danger:     '#E74C3C',
  gray:       '#7F8C8D',
  lightGray:  '#F0E8D5',
  white:      '#FFFFFF',
  background: '#FBF4EC',
} as const;

export type ColorKey = keyof typeof COLORS;
