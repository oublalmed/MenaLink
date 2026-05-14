import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { Avatar, Badge, Chip, EmptyState } from '../../components/atoms';
import { useProviderMissions, useAcceptMission, useDeclineMission } from '../../hooks/api';
import type { ProviderTabsParamList } from '../../navigation/types';
import type { RootStackParamList } from '../../navigation/types';

type RequestsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const DECLINE_REASONS = ['Indisponible ce jour', 'Trop loin', 'Service non proposé', 'Autre'];

interface Mission {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string;
  clientPhone?: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  providerAmount: number;
  status: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
  expiresAt?: string;
}

function getMsUntilExpiry(mission: Mission): number {
  const base = mission.expiresAt
    ? new Date(mission.expiresAt).getTime()
    : new Date(mission.createdAt).getTime() + 30 * 60 * 1000;
  return base - Date.now();
}

function useAllCountdowns(missions: Mission[]): Record<string, number> {
  const [counters, setCounters] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    missions.forEach(m => { init[m.id] = getMsUntilExpiry(m); });
    return init;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setCounters(prev => {
        const next: Record<string, number> = {};
        missions.forEach(m => { next[m.id] = getMsUntilExpiry(m); });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [missions]);

  return counters;
}

function ExpiryBadge({ ms }: { ms: number }) {
  const { colors, fontSize, radius, spacing } = useTheme();
  if (ms <= 0) {
    return (
      <View style={[styles.expiryBadge, { backgroundColor: colors.lightGray, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 }]}>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, fontWeight: '600' }}>Expiré</Text>
      </View>
    );
  }
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    <View style={[styles.expiryBadge, { backgroundColor: colors.danger + '22', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 }]}>
      <Text style={{ color: colors.danger, fontSize: fontSize.caption, fontWeight: '700' }}>
        Expire dans {m}m {s < 10 ? '0' : ''}{s}s
      </Text>
    </View>
  );
}

function RequestCard({
  mission,
  expiryMs,
  onAccept,
  onDecline,
}: {
  mission: Mission;
  expiryMs: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const { colors, spacing, radius, fontSize } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const expired = expiryMs <= 0;

  const handleAccept = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onAccept(mission.id));
  };

  const handleDecline = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDecline(mission.id));
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: expired ? colors.lightGray : colors.card,
          borderRadius: radius.lg,
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          transform: [{ translateX: slideAnim }],
          opacity: expired ? 0.5 : 1,
        },
      ]}
    >
      <View style={{ padding: spacing.md }}>
        {/* Client row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Avatar uri={mission.clientAvatarUrl} name={mission.clientName} size={44} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: fontSize.body }}>{mission.clientName}</Text>
            <Chip label={mission.serviceType} color={colors.primary} />
          </View>
          <ExpiryBadge ms={expiryMs} />
        </View>

        {/* Details */}
        <View style={{ gap: 4, marginBottom: spacing.sm }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
            📅 {mission.scheduledDate} · {mission.scheduledTime} · {mission.durationHours}h
          </Text>
          {mission.address && (
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
              📍 {mission.address}{mission.city ? `, ${mission.city}` : ''}
            </Text>
          )}
        </View>

        {/* Amounts */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>Total client</Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body }}>{mission.totalAmount} MAD</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>Votre gain</Text>
            <Text style={{ color: colors.success, fontWeight: '700', fontSize: fontSize.body }}>{mission.providerAmount} MAD</Text>
          </View>
        </View>

        {/* Action buttons */}
        {!expired && (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success, borderRadius: radius.md, flex: 1 }]}
              onPress={handleAccept}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.body }}>✓ Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger, borderRadius: radius.md, flex: 1 }]}
              onPress={handleDecline}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.body }}>✗ Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

interface DeclineModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comment: string) => Promise<void>;
  isPending: boolean;
}

function DeclineModal({ visible, onClose, onConfirm, isPending }: DeclineModalProps) {
  const { colors, spacing, radius, fontSize } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comment, setComment] = useState('');

  const handleConfirm = async () => {
    const reason = selectedReason === 'Autre' && comment.trim() ? comment.trim() : selectedReason;
    await onConfirm(reason, comment);
    setSelectedReason('');
    setComment('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderRadius: radius.xl }]}>
          <Text style={{ fontSize: fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
            Raison du refus
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {DECLINE_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonChip,
                  {
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    backgroundColor: selectedReason === reason ? colors.danger : colors.background,
                    borderWidth: 1,
                    borderColor: selectedReason === reason ? colors.danger : colors.border,
                  },
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={{ color: selectedReason === reason ? colors.white : colors.text, fontSize: fontSize.caption, fontWeight: '600' }}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Autre' && (
            <TextInput
              style={[
                styles.commentInput,
                { borderColor: colors.border, borderRadius: radius.md, color: colors.text, fontSize: fontSize.body, backgroundColor: colors.background, padding: spacing.sm, marginBottom: spacing.md },
              ]}
              placeholder="Commentaire (optionnel)..."
              placeholderTextColor={colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.lightGray, borderRadius: radius.md, flex: 1 }]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: selectedReason ? colors.danger : colors.border, borderRadius: radius.md, flex: 2 },
              ]}
              onPress={handleConfirm}
              disabled={!selectedReason || isPending}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.body }}>
                {isPending ? 'En cours...' : 'Confirmer le refus'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function RequestsScreen() {
  const { colors, spacing, radius, fontSize } = useTheme();
  const navigation = useNavigation<RequestsNavProp>();
  const { data, isLoading, refetch } = useProviderMissions('PENDING');
  const { mutateAsync: acceptMission, isPending: isAccepting } = useAcceptMission();
  const { mutateAsync: declineMission, isPending: isDeclining } = useDeclineMission();

  const [refreshing, setRefreshing] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [pendingDeclineId, setPendingDeclineId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const missions: Mission[] = (data?.pages ?? []).flatMap(p => p.items ?? []).filter(m => !dismissedIds.has(m.id));
  const counters = useAllCountdowns(missions);

  useEffect(() => {
    if (missions.length > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [missions.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAccept = useCallback(async (bookingId: string) => {
    try {
      await acceptMission(bookingId);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      setDismissedIds(prev => new Set(prev).add(bookingId));
    } catch {}
  }, [acceptMission]);

  const handleDeclinePress = useCallback((bookingId: string) => {
    setPendingDeclineId(bookingId);
    setDeclineModalVisible(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  }, []);

  const handleDeclineConfirm = useCallback(async (reason: string, _comment: string) => {
    if (!pendingDeclineId) return;
    try {
      await declineMission({ bookingId: pendingDeclineId, reason });
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
      setDismissedIds(prev => new Set(prev).add(pendingDeclineId));
    } finally {
      setDeclineModalVisible(false);
      setPendingDeclineId(null);
    }
  }, [pendingDeclineId, declineMission]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md }]}>
        <Text style={{ fontSize: fontSize.h2, fontWeight: '700', color: colors.text }}>Demandes en attente</Text>
        {missions.length > 0 && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginLeft: spacing.sm }}>
            <Badge count={missions.length} color={colors.danger} />
          </Animated.View>
        )}
      </View>

      <FlatList
        data={missions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📨"
              title="Aucune demande"
              description="Vous n'avez aucune demande en attente pour le moment."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RequestCard
            mission={item}
            expiryMs={counters[item.id] ?? getMsUntilExpiry(item)}
            onAccept={handleAccept}
            onDecline={handleDeclinePress}
          />
        )}
      />

      <DeclineModal
        visible={declineModalVisible}
        onClose={() => { setDeclineModalVisible(false); setPendingDeclineId(null); }}
        onConfirm={handleDeclineConfirm}
        isPending={isDeclining}
      />
    </View>
  );
}

function getMsUntilExpiry(mission: Mission): number {
  const base = mission.expiresAt
    ? new Date(mission.expiresAt).getTime()
    : new Date(mission.createdAt).getTime() + 30 * 60 * 1000;
  return base - Date.now();
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionBtn: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  expiryBadge: { alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: 24,
    paddingBottom: 40,
  },
  reasonChip: {},
  commentInput: { borderWidth: 1, textAlignVertical: 'top' },
});
