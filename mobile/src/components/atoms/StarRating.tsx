import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme';

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
  showLabel?: boolean;
}

export const StarRating = React.memo<StarRatingProps>(({
  value,
  max = 5,
  size = 20,
  readonly = true,
  onChange,
  showLabel = false,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <TouchableOpacity
            key={i}
            disabled={readonly}
            onPress={() => onChange?.(i + 1)}
            activeOpacity={0.7}
            style={{ marginRight: 2 }}
          >
            <Text style={{ fontSize: size, color: filled ? colors.warning : colors.lightGray }}>★</Text>
          </TouchableOpacity>
        );
      })}
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
          {value.toFixed(1)}
        </Text>
      )}
    </View>
  );
});

StarRating.displayName = 'StarRating';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500' },
});
