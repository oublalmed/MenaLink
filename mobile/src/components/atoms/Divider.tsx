import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/** Orientation of the divider line */
type DividerOrientation = 'horizontal' | 'vertical';

/**
 * Props for the Divider component.
 */
export interface DividerProps {
  /** Optional label displayed at the center of a horizontal divider */
  label?: string;
  /** Direction of the divider line */
  orientation?: DividerOrientation;
  /** Override the line color */
  color?: string;
  /** Override the line thickness in pixels */
  thickness?: number;
}

/**
 * Visual separator line, optionally with a centered text label.
 *
 * @example
 * <Divider label="ou" />
 * <Divider orientation="vertical" />
 */
export const Divider = React.memo<DividerProps>(
  ({ label, orientation = 'horizontal', color, thickness = 1 }) => {
    const { colors, spacing, fontSize } = useTheme();

    const lineColor = color ?? colors.border;

    if (orientation === 'vertical') {
      return (
        <View
          style={[styles.vertical, { width: thickness, backgroundColor: lineColor }]}
          accessibilityElementsHidden
        />
      );
    }

    if (label != null && label !== '') {
      return (
        <View style={styles.labeledRow}>
          <View style={[styles.line, { backgroundColor: lineColor, height: thickness }]} />
          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
                fontSize: fontSize.caption,
                marginHorizontal: spacing.sm,
              },
            ]}
          >
            {label}
          </Text>
          <View style={[styles.line, { backgroundColor: lineColor, height: thickness }]} />
        </View>
      );
    }

    return (
      <View
        style={[styles.horizontal, { backgroundColor: lineColor, height: thickness }]}
        accessibilityElementsHidden
      />
    );
  },
);

Divider.displayName = 'Divider';

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    alignSelf: 'stretch',
  },
  labeledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
  },
  label: {
    fontWeight: '400',
    textAlign: 'center',
  },
});
