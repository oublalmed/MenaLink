import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import { firebaseDatabase } from '../../services/firebase';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/atoms';
import { ChatBubble } from '../../components/organisms';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderChat'>;

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: 'sent' | 'delivered' | 'read';
}

export function ProviderChatScreen({ route, navigation }: Props) {
  const { bookingId, participantName, participantId, participantAvatarUrl } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Mark messages as read for client (clear their unread count) on open
  useEffect(() => {
    try {
      void set(ref(firebaseDatabase, `chats/${bookingId}/unread/${participantId}`), 0);
    } catch { /* non-critical */ }
  }, [bookingId, participantId]);

  // Clear own unread counter on open
  useEffect(() => {
    if (!user?.id) return;
    try {
      void set(ref(firebaseDatabase, `chats/${bookingId}/unread/${user.id}`), 0);
    } catch { /* non-critical */ }
  }, [bookingId, user?.id]);

  // Firebase: listen for messages
  useEffect(() => {
    const messagesRef = ref(firebaseDatabase, `chats/${bookingId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const val = snapshot.val() as Record<string, any> | null;
      if (!val) { setMessages([]); return; }
      const arr: Message[] = Object.entries(val).map(([id, data]) => ({
        id,
        senderId: (data as any).senderId ?? '',
        text:     (data as any).text ?? '',
        createdAt: (data as any).createdAt ?? 0,
        status:   (data as any).status ?? 'sent',
      }));
      arr.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(arr);
    });
    return () => unsubscribe();
  }, [bookingId]);

  // Firebase: listen for participant typing indicator
  useEffect(() => {
    const typingRef = ref(firebaseDatabase, `chats/${bookingId}/typing/${participantId}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setIsParticipantTyping(!!snapshot.val());
    });
    return () => unsubscribe();
  }, [bookingId, participantId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Clear own typing indicator on unmount
  useEffect(() => {
    return () => {
      if (user?.id) {
        void set(ref(firebaseDatabase, `chats/${bookingId}/typing/${user.id}`), null);
      }
    };
  }, [bookingId, user?.id]);

  // Handlers
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !user) return;
    setInputText('');
    void set(ref(firebaseDatabase, `chats/${bookingId}/typing/${user.id}`), null);

    try {
      await push(ref(firebaseDatabase, `chats/${bookingId}/messages`), {
        senderId: user.id,
        text,
        createdAt: serverTimestamp(),
        status: 'sent',
      });

      // Increment unread counter for the client
      try {
        const unreadRef = ref(firebaseDatabase, `chats/${bookingId}/unread/${participantId}`);
        onValue(unreadRef, (snapshot) => {
          const current = (snapshot.val() as number | null) ?? 0;
          void set(unreadRef, current + 1);
        }, { onlyOnce: true });
      } catch { /* non-critical */ }
    } catch { /* message failed silently */ }
  }, [inputText, user, bookingId, participantId]);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (!user) return;
    void set(
      ref(firebaseDatabase, `chats/${bookingId}/typing/${user.id}`),
      text.length > 0 ? true : null,
    );
  }, [user, bookingId]);

  const handleBlur = useCallback(() => {
    if (user) {
      void set(ref(firebaseDatabase, `chats/${bookingId}/typing/${user.id}`), null);
    }
  }, [user, bookingId]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    return (
      <ChatBubble
        message={{ ...item, createdAt: String(item.createdAt) }}
        isMine={isMine}
        senderName={isMine ? undefined : participantName}
        senderAvatarUrl={isMine ? undefined : participantAvatarUrl}
        showAvatar={!isMine}
      />
    );
  }, [user?.id, participantName, participantAvatarUrl]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const participantParts = useMemo(() => {
    const parts = participantName.split(' ');
    return { firstName: parts[0] ?? '', lastName: parts[1] ?? '' };
  }, [participantName]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
        </TouchableOpacity>
        <Avatar
          {...participantParts}
          uri={participantAvatarUrl}
          size="sm"
          statusBadge="online"
        />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body }}>
            {participantName}
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            <Text style={{ color: colors.success, fontSize: fontSize.caption }}>En ligne</Text>
          </View>
        </View>
      </View>

      {/* Messages + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.sm }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, textAlign: 'center' }}>
                Aucun message. Commencez la conversation.
              </Text>
            </View>
          }
          ListFooterComponent={
            isParticipantTyping ? (
              <View style={[styles.typingRow, { marginBottom: spacing.sm }]}>
                <Avatar
                  {...participantParts}
                  uri={participantAvatarUrl}
                  size="xs"
                />
                <View style={[styles.typingBubble, {
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  marginLeft: spacing.xs,
                }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                    En train d'écrire...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          padding: spacing.sm,
        }]}>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: colors.background,
              borderRadius: radius.full,
              color: colors.text,
              fontSize: fontSize.body,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flex: 1,
              marginRight: spacing.sm,
            }]}
            placeholder="Votre message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[styles.sendBtn, {
              backgroundColor: inputText.trim() ? colors.primary : colors.lightGray,
              borderRadius: radius.full,
            }]}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center' },
  backBtn:      { padding: 4, marginRight: 8 },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  typingRow:    { flexDirection: 'row', alignItems: 'flex-end' },
  typingBubble: { paddingHorizontal: 12, paddingVertical: 8 },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end' },
  textInput:    { maxHeight: 100 },
  sendBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emptyChat:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
