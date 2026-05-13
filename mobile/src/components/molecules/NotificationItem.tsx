import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';

type NotificationType = 'BOOKING' | 'PAYMENT' | 'REVIEW' | 'SYSTEM';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  onPress: (id: string) => void;
}

const TYPE_ICONS: Record<NotificationType, string> = {
  BOOKING: '📋',
  PAYMENT: '💳',
  REVIEW: '⭐',
  SYSTEM: '🔔',
};

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "À l'instant";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} j`;
    return `Il y a ${Math.floor(days / 7)} sem`;
  } catch {
    return '';
  }
}

export const NotificationItem = React.memo<NotificationItemProps>(
  ({ id, type, title, body, isRead, createdAt, onPress }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const unread = !isRead;

    const iconBgMap: Record<NotificationType, string> = {
      BOOKING: colors.primary,
      PAYMENT: colors.success,
      REVIEW: colors.warning,
      SYSTEM: colors.gray,
    };

    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: unread ? `${colors.primary}12` : colors.card,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => onPress(id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ checked: !unread }}
        accessibilityLabel={title}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: `${iconBgMap[type]}20`,
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
            style={[
              styles.title,
              { color: colors.text, fontSize: fontSize.body, fontWeight: unread ? '700' : '500' },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.bodyText,
              { color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 },
            ]}
            numberOfLines={2}
          >
            {body}
          </Text>
          <Text
            style={[
              styles.time,
              { color: colors.textSecondary, fontSize: fontSize.caption - 1, marginTop: 4 },
            ]}
          >
            {relativeTime(createdAt)}
          </Text>
        </View>

        {unread && (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  },
);

NotificationItem.displayName = 'NotificationItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  title: {
    includeFontPadding: false,
  },
  bodyText: {
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 18,
  },
  time: {
    fontWeight: '400',
    includeFontPadding: false,
  },
  dot: {
    width: 8,
    height: 8,
    marginLeft: 8,
    marginTop: 6,
    flexShrink: 0,
  },
});
