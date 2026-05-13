import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';

export type ServiceType = 'CLEANING' | 'IRONING' | 'DEEP_CLEANING' | 'POST_CONSTRUCTION' | 'COOKING';

export interface ServiceChipProps {
  service: ServiceType;
  selected?: boolean;
  onPress?: (service: ServiceType) => void;
  size?: 'sm' | 'md';
}

const SERVICE_LABELS: Record<ServiceType, string> = {
  CLEANING: 'Ménage',
  IRONING: 'Repassage',
  DEEP_CLEANING: 'Grand ménage',
  POST_CONSTRUCTION: 'Post-chantier',
  COOKING: 'Cuisine',
};

const SERVICE_EMOJIS: Record<ServiceType, string> = {
  CLEANING: '🧹',
  IRONING: '🧺',
  DEEP_CLEANING: '🧼',
  POST_CONSTRUCTION: '🏗️',
  COOKING: '👨‍🍳',
};

export const ServiceChip = React.memo<ServiceChipProps>(
  ({ service, selected = false, onPress, size = 'md' }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const isSmall = size === 'sm';
    const paddingV = isSmall ? spacing.xs : spacing.sm;
    const paddingH = isSmall ? spacing.sm : spacing.md;
    const fs = isSmall ? fontSize.caption : fontSize.body;

    const bgColor = selected ? colors.primary : colors.lightGray;
    const textColor = selected ? colors.white : colors.gray;

    const inner = (
      <View
        style={[
          styles.chip,
          {
            backgroundColor: bgColor,
            borderRadius: radius.full,
            paddingVertical: paddingV,
            paddingHorizontal: paddingH,
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: isSmall ? 12 : 14 }]}>
          {SERVICE_EMOJIS[service]}
        </Text>
        <Text style={[styles.label, { color: textColor, fontSize: fs, marginLeft: 4 }]}>
          {SERVICE_LABELS[service]}
        </Text>
      </View>
    );

    if (onPress == null) {
      return inner;
    }

    return (
      <TouchableOpacity
        onPress={() => onPress(service)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={SERVICE_LABELS[service]}
        accessibilityState={{ selected }}
      >
        {inner}
      </TouchableOpacity>
    );
  },
);

ServiceChip.displayName = 'ServiceChip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  emoji: {
    includeFontPadding: false,
  },
  label: {
    fontWeight: '500',
    includeFontPadding: false,
  },
});
