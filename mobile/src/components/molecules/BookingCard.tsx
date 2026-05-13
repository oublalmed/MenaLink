import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Badge, PriceTag } from '../atoms';
import type { Status } from '../../types/ui';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface BookingCardProps {
  id: string;
  providerName: string;
  providerAvatarUrl?: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  status: BookingStatus;
  onPress: (id: string) => void;
}

const STATUS_VARIANT: Record<BookingStatus, Status> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  DISPUTED: 'danger',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  DISPUTED: 'Litige',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const BookingCard = React.memo<BookingCardProps>(
  ({ id, providerName, providerAvatarUrl, serviceType, scheduledDate, scheduledTime, durationHours, totalAmount, status, onPress }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const nameParts = providerName.trim().split(' ');
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
        accessibilityLabel={`Réservation avec ${providerName}`}
      >
        <View style={styles.topRow}>
          <Avatar uri={providerAvatarUrl} firstName={firstName} lastName={lastName} size="md" />

          <View style={[styles.topInfo, { marginLeft: spacing.md }]}>
            <Text style={[styles.providerName, { color: colors.text, fontSize: fontSize.body }]} numberOfLines={1}>
              {providerName}
            </Text>
            <Text style={[styles.serviceType, { color: colors.textSecondary, fontSize: fontSize.caption }]} numberOfLines={1}>
              {serviceType}
            </Text>
          </View>

          <Badge label={STATUS_LABEL[status]} variant={STATUS_VARIANT[status]} size="sm" />
        </View>

        <View
          style={[
            styles.detailsRow,
            {
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
              Date
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.caption }]}>
              {formatDate(scheduledDate)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
              Heure
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.caption }]}>
              {scheduledTime}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
              Durée
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.caption }]}>
              {durationHours}h
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
              Total
            </Text>
            <PriceTag amount={totalAmount} size="sm" />
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

BookingCard.displayName = 'BookingCard';

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topInfo: {
    flex: 1,
  },
  providerName: {
    fontWeight: '600',
  },
  serviceType: {
    marginTop: 2,
    fontWeight: '400',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontWeight: '400',
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '600',
  },
});
