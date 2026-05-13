import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../atoms';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  senderName?: string;
  senderAvatarUrl?: string;
  showAvatar?: boolean;
}

export function ChatBubble({ message, isMine, senderName, senderAvatarUrl, showAvatar = true }: ChatBubbleProps) {
  const { colors, spacing, fontSize, radius } = useTheme();

  const time = new Date(message.createdAt).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });

  const STATUS_ICONS: Record<string, string> = { sent: '✓', delivered: '✓✓', read: '✓✓' };

  return (
    <View style={[styles.row, { flexDirection: isMine ? 'row-reverse' : 'row', marginVertical: spacing.xs, paddingHorizontal: spacing.md }]}>
      {showAvatar && !isMine && (
        <Avatar size={32} uri={senderAvatarUrl} name={senderName} style={{ marginRight: spacing.sm, alignSelf: 'flex-end' }} />
      )}
      <View style={{ maxWidth: '75%' }}>
        {!isMine && senderName != null && (
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: 2, marginLeft: 4 }}>{senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? colors.primary : colors.card,
              borderRadius: radius.lg,
              borderBottomRightRadius: isMine ? radius.sm : radius.lg,
              borderBottomLeftRadius: isMine ? radius.lg : radius.sm,
              padding: spacing.sm,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Text style={{ color: isMine ? colors.white : colors.text, fontSize: fontSize.body, lineHeight: 20 }}>
            {message.text}
          </Text>
          <View style={styles.meta}>
            <Text style={{ color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary, fontSize: 11 }}>{time}</Text>
            {isMine && message.status != null && (
              <Text style={{ color: message.status === 'read' ? '#69D2FF' : 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 3 }}>
                {STATUS_ICONS[message.status]}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end' },
  bubble: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 3 },
});
