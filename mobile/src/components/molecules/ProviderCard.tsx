import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Badge, PriceTag, StarRating } from '../atoms';

export interface ProviderCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  services: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  distanceKm?: number;
  isAvailable: boolean;
  onPress: (id: string) => void;
}

export const ProviderCard = React.memo<ProviderCardProps>(
  ({ id, name, avatarUrl, rating, totalReviews, services, hourlyRateMin, hourlyRateMax, distanceKm, isAvailable, onPress }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
        onPress={() => onPress(id)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Prestataire ${name}`}
      >
        <View style={styles.row}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={avatarUrl} firstName={firstName} lastName={lastName} size="lg" />
            {isAvailable && (
              <View
                style={[
                  styles.availableDot,
                  { backgroundColor: colors.success, borderColor: colors.card },
                ]}
              />
            )}
          </View>

          <View style={[styles.info, { marginLeft: spacing.md }]}>
            <Text
              style={[styles.name, { color: colors.text, fontSize: fontSize.h3 }]}
              numberOfLines={1}
            >
              {name}
            </Text>

            <View style={[styles.ratingRow, { marginTop: spacing.xs }]}>
              <StarRating value={rating} readonly size={14} showLabel />
              <Text
                style={[
                  styles.reviewCount,
                  { color: colors.textSecondary, fontSize: fontSize.caption, marginLeft: spacing.xs },
                ]}
              >
                ({totalReviews})
              </Text>
            </View>

            <Text
              style={[
                styles.services,
                { color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {services.join(' · ')}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { marginTop: spacing.sm }]}>
          <View style={styles.priceRow}>
            <PriceTag amount={hourlyRateMin} size="md" />
            <Text style={[styles.priceSep, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
              {' '}–{' '}
            </Text>
            <PriceTag amount={hourlyRateMax} size="md" />
          </View>

          {distanceKm != null && (
            <Badge label={`📍 ${distanceKm.toFixed(1)} km`} variant="neutral" size="sm" />
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

ProviderCard.displayName = 'ProviderCard';

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontWeight: '400',
  },
  services: {
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSep: {
    fontWeight: '400',
  },
});
