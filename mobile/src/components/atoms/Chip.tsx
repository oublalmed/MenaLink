import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Props for the Chip component.
 */
export interface ChipProps {
  /** Text label displayed inside the chip */
  label: string;
  /** Whether the chip is currently selected */
  selected?: boolean;
  /** Callback when the chip is pressed */
  onPress?: () => void;
  /** Optional icon name (text/emoji) displayed before the label */
  icon?: string;
  /** Disables interaction when true */
  disabled?: boolean;
}

/**
 * Toggleable chip component used for filters and tag selection.
 * Displays with primary color when selected, neutral when unselected.
 *
 * @example
 * <Chip label="Ménage" icon="🧹" selected={selected} onPress={toggle} />
 */
export const Chip = React.memo<ChipProps>(
  ({ label, selected = false, onPress, icon, disabled = false }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const bg = selected ? colors.primary : colors.card;
    const textColor = selected ? colors.white : colors.text;
    const borderColor = selected ? colors.primary : colors.border;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || onPress == null}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        style={[
          styles.chip,
          {
            backgroundColor: bg,
            borderColor,
            borderRadius: radius.full,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm + 4,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {icon != null && icon !== '' && (
          <Text style={[styles.icon, { marginRight: spacing.xs }]}>{icon}</Text>
        )}
        <Text style={[styles.label, { color: textColor, fontSize: fontSize.body }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  },
);

Chip.displayName = 'Chip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 14,
    includeFontPadding: false,
  },
  label: {
    fontWeight: '500',
    includeFontPadding: false,
  },
});
