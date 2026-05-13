import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Badge, StarRating } from '../atoms';

export interface ReviewCardProps {
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  serviceType?: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-MA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const ReviewCard = React.memo<ReviewCardProps>(
  ({ authorName, authorAvatarUrl, rating, comment, createdAt, serviceType }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const nameParts = authorName.trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <View style={styles.header}>
          <Avatar uri={authorAvatarUrl} firstName={firstName} lastName={lastName} size="sm" />

          <View style={[styles.headerInfo, { marginLeft: spacing.sm }]}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: colors.text, fontSize: fontSize.body }]}>
                {authorName}
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
                {formatDate(createdAt)}
              </Text>
            </View>
            <StarRating value={rating} readonly size={14} />
          </View>
        </View>

        <Text
          style={[
            styles.comment,
            { color: colors.text, fontSize: fontSize.body, marginTop: spacing.sm },
          ]}
        >
          {comment}
        </Text>

        {serviceType != null && serviceType !== '' && (
          <View style={{ marginTop: spacing.sm }}>
            <Badge label={serviceType} variant="neutral" size="sm" />
          </View>
        )}
      </View>
    );
  },
);

ReviewCard.displayName = 'ReviewCard';

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  authorName: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontWeight: '400',
  },
  comment: {
    fontWeight: '400',
    lineHeight: 22,
  },
});
