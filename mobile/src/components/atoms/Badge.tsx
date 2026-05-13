import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import type { Status } from '../../../types/ui';

/** Display size of the badge pill */
type BadgeSize = 'sm' | 'md';

/**
 * Props for the Badge component.
 */
export interface BadgeProps {
  /** Text label displayed inside the pill */
  label: string;
  /** Color variant reflecting semantic meaning */
  variant: Status;
  /** Controls padding and font size */
  size?: BadgeSize;
}

/**
 * Pill-shaped badge used to convey status or category.
 *
 * @example
 * <Badge label="Confirmé" variant="success" />
 * <Badge label="En attente" variant="warning" size="sm" />
 */
export const Badge = React.memo<BadgeProps>(({ label, variant, size = 'md' }) => {
  const { colors, spacing, radius, fontSize } = useTheme();

  const variantMap: Record<Status, { bg: string; text: string }> = {
    success: { bg: '#D5F5E3', text: colors.success },
    warning: { bg: '#FDEBD0', text: colors.warning },
    danger: { bg: '#FADBD8', text: colors.danger },
    info: { bg: '#D6EAF8', text: colors.primary },
    neutral: { bg: colors.lightGray, text: colors.gray },
  };

  const sizeMap: Record<BadgeSize, { paddingV: number; paddingH: number; fs: number }> = {
    sm: { paddingV: 2, paddingH: spacing.xs + 2, fs: fontSize.caption - 1 },
    md: { paddingV: spacing.xs, paddingH: spacing.sm, fs: fontSize.caption },
  };

  const vs = variantMap[variant];
  const ss = sizeMap[size];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: vs.bg,
          paddingVertical: ss.paddingV,
          paddingHorizontal: ss.paddingH,
          borderRadius: radius.full,
        },
      ]}
      accessibilityRole="text"
    >
      <Text
        style={[styles.text, { color: vs.text, fontSize: ss.fs }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    includeFontPadding: false,
  },
});
