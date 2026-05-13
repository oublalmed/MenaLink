import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Badge } from '../atoms';
import type { Status } from '../../types/ui';

type TransactionType = 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface TransactionItemProps {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

const TYPE_ICONS: Record<TransactionType, string> = {
  PAYMENT: '💳',
  REFUND: '💸',
  WITHDRAWAL: '🏦',
  COMMISSION: '📊',
};

const STATUS_VARIANT: Record<TransactionStatus, Status> = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING: 'En attente',
  SUCCESS: 'Réussi',
  FAILED: 'Échoué',
};

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

function getAmountDisplay(
  type: TransactionType,
  amount: number,
  colors: { success: string; danger: string; warning: string },
): { text: string; color: string } {
  const formatted = amount.toLocaleString('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  switch (type) {
    case 'PAYMENT':
      return { text: `+${formatted} MAD`, color: colors.success };
    case 'REFUND':
      return { text: `+${formatted} MAD`, color: colors.warning };
    case 'WITHDRAWAL':
      return { text: `-${formatted} MAD`, color: colors.danger };
    case 'COMMISSION':
      return { text: `-${formatted} MAD`, color: colors.danger };
  }
}

export const TransactionItem = React.memo<TransactionItemProps>(
  ({ type, amount, description, status, createdAt }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const amountDisplay = getAmountDisplay(type, amount, colors);

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.card,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${description}, ${amountDisplay.text}`}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: colors.lightGray,
              borderRadius: radius.full,
              width: 42,
              height: 42,
            },
          ]}
        >
          <Text style={styles.iconText}>{TYPE_ICONS[type]}</Text>
        </View>

        <View style={[styles.content, { marginLeft: spacing.md }]}>
          <Text
            style={[styles.description, { color: colors.text, fontSize: fontSize.body }]}
            numberOfLines={1}
          >
            {description}
          </Text>
          <Text
            style={[styles.date, { color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }]}
          >
            {formatDate(createdAt)}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountDisplay.color, fontSize: fontSize.body }]}>
            {amountDisplay.text}
          </Text>
          <View style={{ marginTop: 4, alignItems: 'flex-end' }}>
            <Badge label={STATUS_LABEL[status]} variant={STATUS_VARIANT[status]} size="sm" />
          </View>
        </View>
      </View>
    );
  },
);

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  description: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  date: {
    fontWeight: '400',
    includeFontPadding: false,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
    flexShrink: 0,
  },
  amount: {
    fontWeight: '700',
    includeFontPadding: false,
  },
});
