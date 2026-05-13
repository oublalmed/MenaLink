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
import { getDatabase, onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import { firebaseApp } from '../../services/firebase';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/atoms';
import { ChatBubble } from '../../components/organisms';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: 'sent' | 'delivered' | 'read';
}

export function ChatScreen({ route, navigation }: Props) {
  const { bookingId, participantName, participantId, participantAvatarUrl } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const db = getDatabase(firebaseApp);

  // Listen for messages
  useEffect(() => {
    const messagesRef = ref(db, `chats/${bookingId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setMessages([]);
        return;
      }
      const arr: Message[] = Object.entries(val).map(([id, data]: [string, any]) => ({
        id,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt ?? 0,
        status: data.status ?? 'sent',
      }));
      arr.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(arr);
    });
    return () => unsubscribe();
  }, [bookingId, db]);

  // Listen for participant typing indicator
  useEffect(() => {
    const typingRef = ref(db, `chats/${bookingId}/typing/${participantId}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setIsParticipantTyping(!!snapshot.val());
    });
    return () => unsubscribe();
  }, [bookingId, participantId, db]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (user?.id) {
        void set(ref(db, `chats/${bookingId}/typing/${user.id}`), null);
      }
    };
  }, [bookingId, db, user?.id]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !user) return;
    setInputText('');
    await set(ref(db, `chats/${bookingId}/typing/${user.id}`), null);
    await push(ref(db, `chats/${bookingId}/messages`), {
      senderId: user.id,
      text,
      createdAt: serverTimestamp(),
      status: 'sent',
    });
  }, [inputText, user, bookingId, db]);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (!user) return;
    if (text.length > 0) {
      void set(ref(db, `chats/${bookingId}/typing/${user.id}`), true);
    } else {
      void set(ref(db, `chats/${bookingId}/typing/${user.id}`), null);
    }
  }, [user, bookingId, db]);

  const handleBlur = useCallback(() => {
    if (user) {
      void set(ref(db, `chats/${bookingId}/typing/${user.id}`), null);
    }
  }, [user, bookingId, db]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    return (
      <ChatBubble
        message={item}
        isMine={isMine}
        senderName={isMine ? undefined : participantName}
        senderAvatarUrl={isMine ? undefined : participantAvatarUrl}
        showAvatar={!isMine}
      />
    );
  }, [user?.id, participantName, participantAvatarUrl]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const participantInitials = useMemo(() => {
    const parts = participantName.split(' ');
    return { firstName: parts[0] ?? '', lastName: parts[1] ?? '' };
  }, [participantName]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
        </TouchableOpacity>
        <Avatar {...participantInitials} uri={participantAvatarUrl} size="sm" statusBadge="online" />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body }}>{participantName}</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            <Text style={{ color: colors.success, fontSize: fontSize.caption }}>En ligne</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
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
          ListFooterComponent={
            isParticipantTyping ? (
              <View style={[styles.typingContainer, { marginBottom: spacing.sm }]}>
                <Avatar {...participantInitials} uri={participantAvatarUrl} size="xs" />
                <View style={[styles.typingBubble, { backgroundColor: colors.card, borderRadius: radius.lg, marginLeft: spacing.xs }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>En train d'écrire...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.sm }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderRadius: radius.full, color: colors.text, fontSize: fontSize.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flex: 1, marginRight: spacing.sm }]}
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
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.lightGray, borderRadius: radius.full }]}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 4, marginRight: 8 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end' },
  typingBubble: { paddingHorizontal: 12, paddingVertical: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end' },
  textInput: { maxHeight: 100 },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
