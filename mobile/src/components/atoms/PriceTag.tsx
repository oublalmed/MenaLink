import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/** Display size of the price tag */
type PriceTagSize = 'sm' | 'md' | 'lg';

/** Visual display mode */
type PriceTagVariant = 'default' | 'badge';

/**
 * Props for the PriceTag component.
 */
export interface PriceTagProps {
  /** Numeric amount to display */
  amount: number;
  /** ISO currency label, defaults to MAD */
  currency?: string;
  /** Controls font size */
  size?: PriceTagSize;
  /** 'default' renders inline text; 'badge' wraps in a primary-tinted pill */
  variant?: PriceTagVariant;
}

const FONT_SIZES: Record<PriceTagSize, { amount: number; unit: number }> = {
  sm: { amount: 12, unit: 10 },
  md: { amount: 16, unit: 12 },
  lg: { amount: 22, unit: 14 },
};

/**
 * Displays a formatted price with currency label.
 * In 'default' mode renders "120 MAD/h"; in 'badge' mode wraps in a primary-tinted pill.
 *
 * @example
 * <PriceTag amount={120} />
 * <PriceTag amount={250} variant="badge" size="lg" />
 */
export const PriceTag = React.memo<PriceTagProps>(
  ({ amount, currency = 'MAD', size = 'md', variant = 'default' }) => {
    const { colors, spacing, radius } = useTheme();

    const fs = FONT_SIZES[size];
    const formattedAmount = amount.toLocaleString('fr-MA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const amountColor = variant === 'badge' ? colors.white : colors.primary;
    const unitColor = variant === 'badge' ? 'rgba(255,255,255,0.85)' : colors.textSecondary;

    const content = (
      <View style={styles.row}>
        <Text style={[styles.amount, { fontSize: fs.amount, color: amountColor }]}>
          {formattedAmount}
        </Text>
        <Text
          style={[
            styles.unit,
            { fontSize: fs.unit, color: unitColor, marginLeft: 3 },
          ]}
        >
          {currency}/h
        </Text>
      </View>
    );

    if (variant === 'badge') {
      return (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.full,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
            },
          ]}
        >
          {content}
        </View>
      );
    }

    return content;
  },
);

PriceTag.displayName = 'PriceTag';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontWeight: '700',
    includeFontPadding: false,
  },
  unit: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  badge: {
    alignSelf: 'flex-start',
  },
});
