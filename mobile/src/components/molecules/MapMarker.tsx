import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';

export interface MapMarkerProps {
  type: 'provider' | 'client' | 'selected';
  name?: string;
  rating?: number;
  price?: number;
  onPress?: () => void;
}

export const MapMarker = React.memo<MapMarkerProps>(
  ({ type, name, rating, price, onPress }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const isSelected = type === 'selected';
    const isClient = type === 'client';

    const markerSize = isSelected ? 52 : 40;
    const bgColor = isClient ? colors.danger : colors.primary;
    const emoji = isClient ? '📍' : '🏠';

    const inner = (
      <View style={styles.wrapper}>
        {isSelected && name != null && (
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: colors.card,
                borderRadius: radius.md,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                marginBottom: 4,
                borderWidth: 1,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.bubbleName, { color: colors.text, fontSize: fontSize.caption }]} numberOfLines={1}>
              {name}
            </Text>
            {price != null && (
              <Text style={[styles.bubblePrice, { color: colors.primary, fontSize: fontSize.caption - 1 }]}>
                {price} MAD/h
              </Text>
            )}
            <View style={[styles.bubbleArrow, { borderTopColor: colors.primary }]} />
          </View>
        )}

        <View
          style={[
            styles.circle,
            {
              width: markerSize,
              height: markerSize,
              borderRadius: radius.full,
              backgroundColor: bgColor,
              borderWidth: isSelected ? 3 : 0,
              borderColor: colors.white,
            },
          ]}
        >
          <Text style={{ fontSize: isSelected ? 22 : 18 }}>{emoji}</Text>
        </View>

        {!isClient && (
          <View style={[styles.pin, { borderTopColor: bgColor }]} />
        )}
      </View>
    );

    if (onPress != null) {
      return (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={name ?? type}
        >
          {inner}
        </TouchableOpacity>
      );
    }

    return inner;
  },
);

MapMarker.displayName = 'MapMarker';

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pin: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bubble: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 70,
  },
  bubbleName: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  bubblePrice: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
