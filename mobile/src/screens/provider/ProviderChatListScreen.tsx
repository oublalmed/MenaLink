import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { onValue, ref } from 'firebase/database';
import { firebaseDatabase } from '../../services/firebase';
import { useTheme } from '../../theme';
import { Avatar, EmptyState, LoadingSpinner } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';
import { useProviderMissions } from '../../hooks/api/useProviderMissions';
import type { ProviderTabsParamList } from '../../navigation/types';
import type { RootStackParamList } from '../../navigation/types';
import type { Mission } from '../../store/missionStore';

type ChatListNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabsParamList, 'ChatList'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ChatEntry {
  mission: Mission;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

function groupByAge(entries: ChatEntry[]): { title: string; data: ChatEntry[] }[] {
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);

  const today: ChatEntry[] = [];
  const thisWeek: ChatEntry[] = [];
  const older: ChatEntry[] = [];

  for (const entry of entries) {
    const t = entry.lastMessageTime;
    if (t >= todayStart.getTime()) {
      today.push(entry);
    } else if (t >= weekStart.getTime()) {
      thisWeek.push(entry);
    } else {
      older.push(entry);
    }
  }

  const groups: { title: string; data: ChatEntry[] }[] = [];
  if (today.length)    groups.push({ title: "Aujourd'hui", data: today });
  if (thisWeek.length) groups.push({ title: 'Cette semaine', data: thisWeek });
  if (older.length)    groups.push({ title: 'Plus ancien', data: older });
  return groups;
}

function formatTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' });
}

const SERVICE_LABEL: Record<string, string> = {
  CLEANING:          'Ménage',
  IRONING:           'Repassage',
  DEEP_CLEANING:     'Grand nettoyage',
  POST_CONSTRUCTION: 'Post-chantier',
  COOKING:           'Cuisine',
};

export function ProviderChatListScreen() {
  const navigation = useNavigation<ChatListNavProp>();
  const { colors, spacing, fontSize, radius } = useTheme();
  const user = useAuthStore((s) => s.user);

  const { data: confirmedPages, isLoading: loadingConfirmed } = useProviderMissions('CONFIRMED');
  const { data: inProgressPages, isLoading: loadingInProgress } = useProviderMissions('IN_PROGRESS');

  const missions = useMemo<Mission[]>(() => {
    const confirmed  = confirmedPages?.pages.flatMap((p) => p.items) ?? [];
    const inProgress = inProgressPages?.pages.flatMap((p) => p.items) ?? [];
    return [...confirmed, ...inProgress];
  }, [confirmedPages, inProgressPages]);

  const [chatEntries, setChatEntries] = useState<Map<string, Omit<ChatEntry, 'mission'>>>(new Map());

  // Subscribe to Firebase for each mission's last message + unread count
  useEffect(() => {
    if (!user?.id || missions.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    missions.forEach((mission) => {
      // Last message listener
      const messagesRef = ref(firebaseDatabase, `chats/${mission.id}/messages`);
      const unsub1 = onValue(messagesRef, (snapshot) => {
        const val = snapshot.val() as Record<string, any> | null;
        if (!val) return;
        const messages = Object.values(val);
        messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        const last = messages[messages.length - 1];
        setChatEntries((prev) => {
          const next = new Map(prev);
          const existing = next.get(mission.id) ?? { lastMessage: '', lastMessageTime: 0, unreadCount: 0 };
          next.set(mission.id, {
            ...existing,
            lastMessage: last?.text ?? '',
            lastMessageTime: typeof last?.createdAt === 'number' ? last.createdAt : Date.now(),
          });
          return next;
        });
      });

      // Unread count listener
      if (user?.id) {
        const unreadRef = ref(firebaseDatabase, `chats/${mission.id}/unread/${user.id}`);
        const unsub2 = onValue(unreadRef, (snapshot) => {
          const count = (snapshot.val() as number | null) ?? 0;
          setChatEntries((prev) => {
            const next = new Map(prev);
            const existing = next.get(mission.id) ?? { lastMessage: '', lastMessageTime: 0, unreadCount: 0 };
            next.set(mission.id, { ...existing, unreadCount: count });
            return next;
          });
        });
        unsubscribers.push(unsub2);
      }

      unsubscribers.push(unsub1);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [missions, user?.id]);

  const sortedEntries = useMemo<ChatEntry[]>(() => {
    return missions
      .map((mission) => {
        const data = chatEntries.get(mission.id) ?? {
          lastMessage: 'Aucun message',
          lastMessageTime: new Date(mission.createdAt).getTime(),
          unreadCount: 0,
        };
        return { mission, ...data };
      })
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [missions, chatEntries]);

  const groups = useMemo(() => groupByAge(sortedEntries), [sortedEntries]);

  // Flatten groups into a renderable list with section headers
  const flatList = useMemo<{ type: 'header'; title: string } | { type: 'item'; entry: ChatEntry }[]>(() => {
    const result: ({ type: 'header'; title: string } | { type: 'item'; entry: ChatEntry })[] = [];
    for (const group of groups) {
      result.push({ type: 'header', title: group.title });
      for (const entry of group.data) {
        result.push({ type: 'item', entry });
      }
    }
    return result;
  }, [groups]);

  const isLoading = loadingConfirmed || loadingInProgress;

  const handleChatPress = useCallback((entry: ChatEntry) => {
    navigation.navigate('ProviderChat', {
      bookingId: entry.mission.id,
      participantName: entry.mission.clientName,
      participantId: entry.mission.clientId,
      participantAvatarUrl: entry.mission.clientAvatarUrl,
    });
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen title */}
      <View style={[styles.titleRow, { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2 }]}>Messages</Text>
      </View>

      {flatList.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>💬</Text>}
          title="Aucune conversation active"
          description="Vos conversations avec les clients apparaîtront ici lorsque des missions sont confirmées ou en cours."
        />
      ) : (
        <FlatList
          data={flatList}
          keyExtractor={(item, idx) =>
            item.type === 'header' ? `header-${item.title}` : `item-${item.entry.mission.id}-${idx}`
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={[styles.groupHeader, {
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.sm,
                  paddingBottom: spacing.xs,
                }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.title}
                  </Text>
                </View>
              );
            }

            const { entry } = item;
            const { mission } = entry;
            const nameParts = mission.clientName.split(' ');

            return (
              <TouchableOpacity
                onPress={() => handleChatPress(entry)}
                style={[styles.chatRow, {
                  backgroundColor: colors.card,
                  borderBottomColor: colors.border,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 2,
                }]}
                activeOpacity={0.7}
              >
                <Avatar
                  firstName={nameParts[0]}
                  lastName={nameParts[1] ?? ''}
                  uri={mission.clientAvatarUrl}
                  size="md"
                />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body, flex: 1 }} numberOfLines={1}>
                      {mission.clientName}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                      {formatTime(entry.lastMessageTime)}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }} numberOfLines={1}>
                      {SERVICE_LABEL[mission.serviceType] ?? mission.serviceType}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{
                        color: entry.unreadCount > 0 ? colors.text : colors.textSecondary,
                        fontSize: fontSize.caption,
                        fontWeight: entry.unreadCount > 0 ? '600' : '400',
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {entry.lastMessage}
                    </Text>
                    {entry.unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                          {entry.unreadCount > 99 ? '99+' : entry.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow:     { flexDirection: 'row', alignItems: 'center' },
  title:        { fontWeight: '800' },
  groupHeader:  {},
  chatRow:      { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  unreadBadge:  { minWidth: 20, height: 20, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
});
