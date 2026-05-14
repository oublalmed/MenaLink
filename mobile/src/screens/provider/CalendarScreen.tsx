import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useProviderMissions } from '../../hooks/api/useProviderMissions';
import type { ProviderTabsParamList, RootStackParamList } from '../../navigation/types';
import type { Mission } from '../../store/missionStore';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isToday(date: Date): boolean {
  return toDateString(date) === toDateString(new Date());
}

function statusColor(status: string, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (status) {
    case 'CONFIRMED': return colors.primary;
    case 'IN_PROGRESS': return colors.warning;
    case 'COMPLETED': return colors.gray;
    default: return colors.warning;
  }
}

// ─── Mission block inside week cell ──────────────────────────────────────────
interface MissionBlockProps {
  mission: Mission;
  onPress: () => void;
}
function MissionBlock({ mission, onPress }: MissionBlockProps): React.JSX.Element {
  const { colors, radius } = useTheme();
  const isPending = mission.status === 'PENDING';
  const bg = isPending ? colors.warning : statusColor(mission.status, colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.missionBlock,
        {
          backgroundColor: isPending ? 'transparent' : bg + '22',
          borderColor: bg,
          borderRadius: radius.sm,
          borderWidth: isPending ? 1.5 : 1,
          borderStyle: isPending ? 'dashed' : 'solid',
          marginBottom: 2,
          paddingHorizontal: 3,
          paddingVertical: 2,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{ color: isPending ? colors.warning : bg, fontSize: 9, fontWeight: '600' }}
      >
        {mission.clientName}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 8 }}>{mission.scheduledTime}</Text>
    </TouchableOpacity>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────
interface WeekViewProps {
  weekStart: Date;
  missions: Mission[];
  onMissionPress: (bookingId: string) => void;
  onEmptySlotPress: (date: Date) => void;
}
function WeekView({ weekStart, missions, onMissionPress, onEmptySlotPress }: WeekViewProps): React.JSX.Element {
  const { colors, spacing } = useTheme();
  const hours = [8, 10, 12, 14, 16, 18, 20];
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Day headers */}
      <View style={[styles.row, { paddingLeft: 36 }]}>
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{DAYS_FR[i]}</Text>
              <View
                style={[
                  styles.dayNumberPill,
                  today && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={{ color: today ? colors.white : colors.text, fontSize: 11, fontWeight: today ? '700' : '400' }}>
                  {day.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Hourly rows */}
      {hours.map((hour) => (
        <View key={hour} style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={{ width: 36, paddingTop: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, textAlign: 'right', paddingRight: 4 }}>
              {String(hour).padStart(2, '0')}:00
            </Text>
          </View>
          {days.map((day, i) => {
            const dateStr = toDateString(day);
            const dayMissions = missions.filter((m) => m.scheduledDate === dateStr).slice(0, 3);
            return (
              <TouchableOpacity
                key={i}
                style={{
                  flex: 1,
                  minHeight: 52,
                  borderLeftWidth: 1,
                  borderLeftColor: colors.border,
                  padding: 2,
                }}
                onPress={() => { if (dayMissions.length === 0) onEmptySlotPress(day); }}
                activeOpacity={dayMissions.length === 0 ? 0.5 : 1}
              >
                {hour === 8 && dayMissions.map((m) => (
                  <MissionBlock key={m.id} mission={m} onPress={() => onMissionPress(m.id)} />
                ))}
                {hour === 8 && dayMissions.length === 0 && (
                  <Text style={{ color: colors.border, fontSize: 14, textAlign: 'center', marginTop: 4 }}>+</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────
interface MonthViewProps {
  year: number;
  month: number;
  missions: Mission[];
  onDayPress: (date: Date) => void;
}
function MonthView({ year, month, missions, onDayPress }: MonthViewProps): React.JSX.Element {
  const { colors, spacing, fontSize } = useTheme();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const n = i - startOffset + 1;
    return n >= 1 && n <= daysInMonth ? n : null;
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
      <View style={styles.row}>
        {DAYS_FR.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: totalCells / 7 }, (_, row) => (
        <View key={row} style={[styles.row, { marginBottom: 4 }]}>
          {cells.slice(row * 7, row * 7 + 7).map((dayNum, col) => {
            if (dayNum === null) return <View key={col} style={{ flex: 1 }} />;
            const date = new Date(year, month, dayNum);
            const dateStr = toDateString(date);
            const dayMissions = missions.filter((m) => m.scheduledDate === dateStr).slice(0, 3);
            const today = isToday(date);
            return (
              <TouchableOpacity
                key={col}
                style={{ flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: spacing.xs, backgroundColor: today ? colors.primary + '18' : 'transparent' }}
                onPress={() => onDayPress(date)}
                activeOpacity={0.7}
              >
                <Text style={{ color: today ? colors.primary : colors.text, fontSize: fontSize.caption, fontWeight: today ? '700' : '400' }}>
                  {dayNum}
                </Text>
                <View style={[styles.row, { gap: 2, marginTop: 2 }]}>
                  {dayMissions.map((m, idx) => (
                    <View key={idx} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusColor(m.status, colors) }} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Availability Bottom Sheet ────────────────────────────────────────────────
interface AvailabilitySheetProps {
  visible: boolean;
  onClose: () => void;
}
function AvailabilitySheet({ visible, onClose }: AvailabilitySheetProps): React.JSX.Element {
  const { colors, spacing, radius, fontSize } = useTheme();

  const handleBlockWeek = (): void => {
    Alert.alert('Bloquer la semaine', 'Voulez-vous bloquer toute la semaine ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: onClose },
    ]);
  };
  const handleOpenWeek = (): void => {
    Alert.alert('Rendre disponible', 'Rendre toute la semaine disponible ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: onClose },
    ]);
  };
  const handleSelectSlots = (): void => {
    Alert.alert('Sélectionner des créneaux', 'Cette fonctionnalité sera disponible prochainement.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={{ color: colors.text, fontSize: fontSize.h3, fontWeight: '700', marginBottom: spacing.md }}>
          Modifier disponibilités
        </Text>
        {[
          { label: '🚫 Bloquer cette semaine', color: colors.danger, onPress: handleBlockWeek },
          { label: '✅ Rendre disponible toute la semaine', color: colors.success, onPress: handleOpenWeek },
          { label: '🕐 Sélectionner des créneaux', color: colors.primary, onPress: handleSelectSlots },
        ].map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.sheetBtn, { backgroundColor: btn.color + '18', borderColor: btn.color, borderRadius: radius.md, marginTop: i > 0 ? spacing.sm : 0 }]}
            onPress={btn.onPress}
            activeOpacity={0.8}
          >
            <Text style={{ color: btn.color, fontWeight: '600', fontSize: fontSize.body }}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.sheetBtn, { backgroundColor: colors.border, borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.md }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.body }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function CalendarScreen(): React.JSX.Element {
  const { colors, spacing, radius, fontSize } = useTheme();
  const navigation = useNavigation<NavProp>();

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMondayOf(new Date()));
  const [currentMonth, setCurrentMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [sheetVisible, setSheetVisible] = useState(false);

  const TOGGLE_W = 130;
  const toggleX = useSharedValue(0);
  const animatedSlider = useAnimatedStyle(() => ({ transform: [{ translateX: toggleX.value }] }));

  const switchView = useCallback((mode: 'week' | 'month') => {
    setViewMode(mode);
    toggleX.value = withTiming(mode === 'week' ? 0 : TOGGLE_W, { duration: 220 });
  }, [toggleX]);

  const { data } = useProviderMissions();
  const allMissions: Mission[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const prevWeek = (): void => setCurrentWeekStart((d) => addDays(d, -7));
  const nextWeek = (): void => setCurrentWeekStart((d) => addDays(d, 7));
  const prevMonth = (): void =>
    setCurrentMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  const nextMonth = (): void =>
    setCurrentMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });

  const weekEnd = addDays(currentWeekStart, 6);
  const weekLabel = `Semaine du ${currentWeekStart.getDate()} au ${weekEnd.getDate()} ${MONTHS_FR[weekEnd.getMonth()]}`;

  const handleEmptySlot = (date: Date): void => {
    Alert.alert(`${date.getDate()} ${MONTHS_FR[date.getMonth()]}`, 'Que souhaitez-vous faire ?', [
      { text: 'Marquer disponible', onPress: () => {} },
      { text: 'Bloquer ce créneau', onPress: () => {} },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleMonthDayPress = (date: Date): void => {
    setCurrentWeekStart(getMondayOf(date));
    switchView('week');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }]}>
        <Text style={{ color: colors.text, fontSize: fontSize.h2, fontWeight: '700' }}>Calendrier</Text>
        {/* Segmented toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.border, borderRadius: radius.full, width: TOGGLE_W * 2 }]}>
          <Animated.View style={[styles.toggleSlider, animatedSlider, { width: TOGGLE_W - 4, backgroundColor: colors.card, borderRadius: radius.full, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]} />
          <TouchableOpacity style={[styles.toggleBtn, { width: TOGGLE_W }]} onPress={() => switchView('week')} activeOpacity={0.8}>
            <Text style={{ color: viewMode === 'week' ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>📅 Semaine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, { width: TOGGLE_W }]} onPress={() => switchView('month')} activeOpacity={0.8}>
            <Text style={{ color: viewMode === 'month' ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>🗓️ Mois</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-header navigation */}
      <View style={[styles.row, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, alignItems: 'center' }]}>
        <TouchableOpacity onPress={viewMode === 'week' ? prevWeek : prevMonth} style={{ padding: 4 }} activeOpacity={0.7}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: fontSize.body, fontWeight: '600', flex: 1, textAlign: 'center' }}>
          {viewMode === 'week' ? weekLabel : `${MONTHS_FR[currentMonth.month]} ${currentMonth.year}`}
        </Text>
        <TouchableOpacity onPress={viewMode === 'week' ? nextWeek : nextMonth} style={{ padding: 4 }} activeOpacity={0.7}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {viewMode === 'week' ? (
          <WeekView
            weekStart={currentWeekStart}
            missions={allMissions}
            onMissionPress={(id) => navigation.navigate('ProviderBookingDetail', { bookingId: id })}
            onEmptySlotPress={handleEmptySlot}
          />
        ) : (
          <MonthView
            year={currentMonth.year}
            month={currentMonth.month}
            missions={allMissions}
            onDayPress={handleMonthDayPress}
          />
        )}
      </View>

      {/* Floating availability button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, borderRadius: radius.full, bottom: spacing.xl, right: spacing.md }]}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>🗂️ Disponibilités</Text>
      </TouchableOpacity>

      <AvailabilitySheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggleContainer: { flexDirection: 'row', height: 34, position: 'relative', overflow: 'hidden' },
  toggleSlider: { position: 'absolute', top: 2, left: 2, bottom: 2 },
  toggleBtn: { height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dayNumberPill: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  missionBlock: {},
  fab: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetBtn: { paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
});
