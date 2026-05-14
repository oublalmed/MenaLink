import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { Avatar, Button, LoadingSpinner } from '../../components/atoms';
import { useBooking } from '../../hooks/api/useBookings';
import { useCompleteMission } from '../../hooks/api/useProviderMissions';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveMission'>;

// ─── Checklist config ─────────────────────────────────────────────────────────
const CHECKLIST_BY_SERVICE: Record<string, string[]> = {
  CLEANING: ['Cuisine', 'Salon', 'Chambres', 'Salle de bain', 'Entrée'],
  DEEP_CLEANING: ['Cuisine', 'Salon', 'Chambres', 'Salle de bain', 'Entrée', 'Vitres', 'Placards'],
};

// ─── Elapsed time formatter ───────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Progress ring ────────────────────────────────────────────────────────────
interface ProgressRingProps {
  elapsedSeconds: number;
  totalSeconds: number;
  size?: number;
}
function ProgressRing({ elapsedSeconds, totalSeconds, size = 200 }: ProgressRingProps): React.JSX.Element {
  const { colors } = useTheme();
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);

  let ringColor = colors.primary;
  if (progress >= 1) ringColor = colors.danger;
  else if (progress >= 0.8) ringColor = colors.warning;

  const dashOffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={ringColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

// ─── Checkbox item ────────────────────────────────────────────────────────────
interface CheckItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}
function CheckItem({ label, checked, onToggle }: CheckItemProps): React.JSX.Element {
  const { colors, spacing, radius, fontSize } = useTheme();
  const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  const handlePress = (): void => {
    onToggle();
    if (!checked) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.checkRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            width: 24,
            height: 24,
            borderRadius: radius.sm,
            borderWidth: 2,
            borderColor: checked ? colors.success : colors.border,
            backgroundColor: checked ? colors.success : 'transparent',
            marginRight: spacing.sm,
          },
        ]}
      >
        {checked && (
          <Animated.Text style={{ color: colors.white, fontSize: 14, fontWeight: '700', transform: [{ scale: scaleAnim }] }}>
            ✓
          </Animated.Text>
        )}
      </View>
      <Text style={{ color: checked ? colors.textSecondary : colors.text, fontSize: fontSize.body, flex: 1, textDecorationLine: checked ? 'line-through' : 'none' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function ActiveMissionScreen({ route, navigation }: Props): React.JSX.Element {
  const { bookingId } = route.params;
  const { colors, spacing, radius, fontSize } = useTheme();

  const { data: booking, isLoading } = useBooking(bookingId);
  const { mutateAsync: completeMission, isPending: isCompleting } = useCompleteMission();

  // ─ Chrono state ─
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!booking) return;
    const startTs = booking.startedAt ? new Date(booking.startedAt).getTime() : Date.now();
    const tick = (): void => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  // ─ Checklist state ─
  const checklistItems = CHECKLIST_BY_SERVICE[booking?.serviceType ?? ''] ?? [];
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const toggleCheck = useCallback((item: string): void => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  }, []);

  const checkedCount = checklistItems.filter((i) => checklist[i]).length;

  // ─ Derived values ─
  const totalSeconds = (booking?.durationHours ?? 1) * 3600;
  const isOvertime = elapsedSeconds > totalSeconds;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const overtimeSeconds = isOvertime ? elapsedSeconds - totalSeconds : 0;

  const remainingH = Math.floor(remainingSeconds / 3600);
  const remainingM = Math.floor((remainingSeconds % 3600) / 60);
  const overtimeM = Math.floor(overtimeSeconds / 60);

  // ─ Map link ─
  const handleOpenMap = (): void => {
    if (!booking) return;
    const query = encodeURIComponent(
      [booking.notes, 'Casablanca'].filter(Boolean).join(', '),
    );
    const url = `https://maps.google.com/?q=${query}`;
    Alert.alert('Ouvrir Maps', 'Voulez-vous ouvrir Google Maps ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ouvrir', onPress: () => void Linking.openURL(url) },
    ]);
  };

  // ─ Complete mission ─
  const handleComplete = (): void => {
    if (checklistItems.length > 0 && checkedCount < checklistItems.length) {
      Alert.alert(
        'Tâches incomplètes',
        `${checklistItems.length - checkedCount} tâche(s) non cochée(s). Terminer quand même ?`,
        [
          { text: 'Continuer à travailler', style: 'cancel' },
          { text: 'Terminer', style: 'destructive', onPress: doComplete },
        ],
      );
    } else {
      Alert.alert('Terminer la mission', 'Confirmer la fin de cette mission ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: doComplete },
      ]);
    }
  };

  const doComplete = (): void => {
    void completeMission(bookingId).then(() => navigation.goBack());
  };

  // ─ Chat ─
  const handleChat = (): void => {
    if (!booking) return;
    navigation.navigate('ProviderChat', {
      bookingId,
      participantName: booking.providerName,
      participantId: booking.clientId,
    });
  };

  // ─ Ring color for progress ─
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);
  let chronoColor = colors.primary;
  if (progress >= 1) chronoColor = colors.danger;
  else if (progress >= 0.8) chronoColor = colors.warning;

  const RING_SIZE = 200;

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─ Client card ─ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, margin: spacing.md, borderRadius: radius.lg, padding: spacing.md }]}>
          <View style={[styles.row, { marginBottom: spacing.sm }]}>
            <Avatar size={48} uri={booking.providerAvatarUrl} name={booking.providerName} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={{ color: colors.text, fontSize: fontSize.h3, fontWeight: '700' }}>
                {booking.providerName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                {booking.serviceType.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
              <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '700' }}>EN COURS</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.row, { marginTop: spacing.xs }]} onPress={handleOpenMap} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>🗺️</Text>
            <Text style={{ color: colors.primary, fontSize: fontSize.body, textDecorationLine: 'underline', flex: 1 }}>
              {booking.notes ?? 'Voir sur la carte'}
            </Text>
          </TouchableOpacity>

          {booking.notes != null && (
            <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.lightGray, borderRadius: radius.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                📝 {booking.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ─ Chronomètre ─ */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing elapsedSeconds={elapsedSeconds} totalSeconds={totalSeconds} size={RING_SIZE} />
            <Text style={{ color: chronoColor, fontSize: 38, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: 2 }}>
              {formatElapsed(elapsedSeconds)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 4 }}>
              {booking.scheduledTime} · {booking.durationHours}h prévues
            </Text>
          </View>

          {/* Time remaining / overtime */}
          <View style={{ marginTop: spacing.sm }}>
            {isOvertime ? (
              <Text style={{ color: colors.danger, fontSize: fontSize.body, fontWeight: '600' }}>
                ⚠️ Dépassement : +{overtimeM}m
              </Text>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
                Temps restant : {remainingH > 0 ? `${remainingH}h ` : ''}{remainingM}m
              </Text>
            )}
          </View>
        </View>

        {/* ─ Checklist ─ */}
        {checklistItems.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: spacing.md, borderRadius: radius.lg, padding: spacing.md }]}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.sm }]}>
              <Text style={{ color: colors.text, fontSize: fontSize.h3, fontWeight: '700' }}>Tâches</Text>
              <View style={[styles.progressBadge, { backgroundColor: checkedCount === checklistItems.length ? colors.success + '22' : colors.primary + '18' }]}>
                <Text style={{ color: checkedCount === checklistItems.length ? colors.success : colors.primary, fontSize: fontSize.caption, fontWeight: '700' }}>
                  {checkedCount}/{checklistItems.length} tâches
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.border, borderRadius: radius.full, marginBottom: spacing.md }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${checklistItems.length > 0 ? (checkedCount / checklistItems.length) * 100 : 0}%`,
                    backgroundColor: checkedCount === checklistItems.length ? colors.success : colors.primary,
                    borderRadius: radius.full,
                  },
                ]}
              />
            </View>

            {checklistItems.map((item) => (
              <CheckItem
                key={item}
                label={item}
                checked={checklist[item] ?? false}
                onToggle={() => toggleCheck(item)}
              />
            ))}
          </View>
        )}

        {/* ─ Booking details ─ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radius.lg, padding: spacing.md }]}>
          <Text style={{ color: colors.text, fontSize: fontSize.h3, fontWeight: '700', marginBottom: spacing.sm }}>Détails</Text>
          {[
            { label: '📅 Date', value: `${booking.scheduledDate} à ${booking.scheduledTime}` },
            { label: '⏱️ Durée', value: `${booking.durationHours}h` },
            { label: '💰 Gains', value: `${booking.providerAmount} MAD` },
            { label: '💳 Paiement', value: booking.paymentMethod === 'CASH' ? 'Espèces' : 'En ligne' },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.row, { justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>{label}</Text>
              <Text style={{ color: colors.text, fontSize: fontSize.body, fontWeight: '600' }}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ─ Bottom CTA ─ */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <TouchableOpacity
          style={[styles.ghostBtn, { borderColor: colors.primary, borderRadius: radius.md, flex: 1, marginRight: spacing.sm }]}
          onPress={handleChat}
          activeOpacity={0.8}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.body }}>💬 Contacter le client</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: isCompleting ? colors.gray : colors.success, borderRadius: radius.md, flex: 1.4 }]}
          onPress={handleComplete}
          disabled={isCompleting}
          activeOpacity={0.85}
        >
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.body }}>
            {isCompleting ? 'Envoi...' : '🏁 Terminer la mission'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  progressBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressTrack: { height: 6 },
  progressFill: { height: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { alignItems: 'center', justifyContent: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 16,
  },
  ghostBtn: { borderWidth: 1.5, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
});
