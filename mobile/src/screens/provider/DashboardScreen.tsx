import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Avatar, Badge, LoadingSpinner } from '../../components/atoms';
import { useProviderStats, useProviderMissions } from '../../hooks/api';
import { useProviderStore } from '../../store/providerStore';
import { useAuthStore } from '../../store/authStore';
import { useMissionStore } from '../../store/missionStore';
import type { ProviderTabsParamList } from '../../navigation/types';
import type { RootStackParamList } from '../../navigation/types';

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_MAX_HEIGHT = 60;

function useCountdownMs(scheduledDate: string, scheduledTime: string): number {
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    const compute = () => {
      const dt = new Date(`${scheduledDate}T${scheduledTime}`);
      setRemaining(dt.getTime() - Date.now());
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [scheduledDate, scheduledTime]);
  return remaining;
}

function CountdownLabel({ scheduledDate, scheduledTime }: { scheduledDate: string; scheduledTime: string }) {
  const { colors, fontSize } = useTheme();
  const ms = useCountdownMs(scheduledDate, scheduledTime);
  if (ms <= 0) {
    return <Text style={{ color: colors.danger, fontSize: fontSize.caption, fontWeight: '700' }}>Maintenant</Text>;
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return (
    <Text style={{ color: colors.primary, fontSize: fontSize.caption, fontWeight: '600' }}>
      Dans {h}h {m}m
    </Text>
  );
}

function KpiCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const { colors, spacing, radius, fontSize } = useTheme();
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.card, borderRadius: radius.lg, width: (SCREEN_WIDTH - 44) / 2 }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={{ fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs }}>{title}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: color, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function WeeklyBarChart({ data }: { data: { day: string; amount: number }[] }) {
  const { colors, spacing, fontSize } = useTheme();
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  const max = Math.max(...data.map(d => d.amount), 1);

  useEffect(() => {
    const animations = data.map((d, i) =>
      Animated.timing(anims[i], {
        toValue: (d.amount / max) * BAR_MAX_HEIGHT,
        duration: 400,
        delay: i * 50,
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.sm }}>
      {data.map((d, i) => (
        <View key={`${d.day}-${i}`} style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 2 }}>
            {d.amount > 0 ? String(d.amount) : ''}
          </Text>
          <Animated.View
            style={{
              height: anims[i],
              width: 18,
              backgroundColor: colors.primary,
              borderRadius: 4,
              minHeight: 2,
            }}
          />
          <Text style={{ fontSize: fontSize.caption - 1, color: colors.textSecondary, marginTop: 4 }}>{d.day}</Text>
        </View>
      ))}
    </View>
  );
}

export function DashboardScreen() {
  const { colors, spacing, radius, fontSize } = useTheme();
  const navigation = useNavigation<DashboardNavProp>();
  const { user } = useAuthStore();
  const { isAvailable, toggleAvailability } = useProviderStore();
  const { pendingMissions, fetchPendingMissions } = useMissionStore();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useProviderStats();
  const { data: confirmedData, isLoading: missionsLoading, refetch: refetchMissions } = useProviderMissions('CONFIRMED');
  const [refreshing, setRefreshing] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const nextMission = confirmedData?.pages?.[0]?.items?.[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchMissions(), fetchPendingMissions()]);
    setRefreshing(false);
  }, [refetchStats, refetchMissions, fetchPendingMissions]);

  const handleToggleAvailability = async (val: boolean) => {
    setTogglingAvail(true);
    try {
      await toggleAvailability(val);
    } finally {
      setTogglingAvail(false);
    }
  };

  if (statsLoading && !stats) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  const weekly = stats?.weeklyEarnings ?? [];
  const activity = stats?.recentActivity ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.h2, fontWeight: '700', color: colors.text }}>
            Bonjour {user?.firstName} 👋
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={togglingAvail}
              trackColor={{ false: colors.gray, true: colors.success }}
              thumbColor={colors.white}
            />
            <Text style={{ marginLeft: spacing.xs, fontSize: fontSize.caption, color: isAvailable ? colors.success : colors.textSecondary, fontWeight: '600' }}>
              {isAvailable ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar
            uri={user?.avatarUrl}
            name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
            size={48}
          />
        </TouchableOpacity>
      </View>

      {/* KPI Grid */}
      <View style={[styles.kpiGrid, { paddingHorizontal: spacing.md, marginTop: spacing.md }]}>
        <KpiCard title="Missions aujourd'hui" value={String(stats?.todayMissions ?? 0)} icon="📅" color={colors.primary} />
        <KpiCard title="Gains du jour" value={`${stats?.todayEarnings ?? 0} MAD`} icon="💰" color={colors.success} />
        <KpiCard title="Note moyenne" value={(stats?.averageRating ?? 0).toFixed(1) + ' ⭐'} icon="⭐" color={colors.warning} />
        <KpiCard title="Ce mois" value={`${stats?.monthMissions ?? 0} missions`} icon="📊" color={colors.primary} />
      </View>

      {/* Next Mission */}
      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
        <Text style={{ fontSize: fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>Prochaine mission</Text>
        {missionsLoading ? (
          <LoadingSpinner />
        ) : nextMission ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Avatar uri={nextMission.clientAvatarUrl} name={nextMission.clientName} size={40} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: fontSize.body }}>{nextMission.clientName}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{nextMission.serviceType}</Text>
              </View>
              <Text style={{ color: colors.success, fontWeight: '700', fontSize: fontSize.body }}>{nextMission.totalAmount} MAD</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                📅 {nextMission.scheduledDate} · {nextMission.scheduledTime}
              </Text>
              <CountdownLabel scheduledDate={nextMission.scheduledDate} scheduledTime={nextMission.scheduledTime} />
            </View>
            {nextMission.address ? (
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: spacing.sm }}>
                📍 {nextMission.address}{nextMission.city ? `, ${nextMission.city}` : ''}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.detailBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
              onPress={() => navigation.navigate('ProviderBookingDetail', { bookingId: nextMission.id })}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.body }}>Voir détails</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>Aucune mission confirmée</Text>
          </View>
        )}
      </View>

      {/* Pending Requests */}
      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
        <Text style={{ fontSize: fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>Demandes en attente</Text>
        <TouchableOpacity
          style={[styles.pendingRow, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }]}
          onPress={() => navigation.navigate('Requests')}
        >
          <Text style={{ color: colors.text, fontSize: fontSize.body, flex: 1 }}>
            {pendingMissions.length > 0
              ? `${pendingMissions.length} demande(s) en attente`
              : 'Aucune demande en attente'}
          </Text>
          {pendingMissions.length > 0 && (
            <Badge count={pendingMissions.length} color={colors.danger} />
          )}
          <Text style={{ color: colors.textSecondary, marginLeft: spacing.xs, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Bar Chart */}
      {weekly.length > 0 && (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
          <Text style={{ fontSize: fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>Gains de la semaine</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }]}>
            <WeeklyBarChart data={weekly} />
          </View>
        </View>
      )}

      {/* Recent Activity */}
      {activity.length > 0 && (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
          <Text style={{ fontSize: fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>Activité récente</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg }}>
            {activity.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
                  idx < activity.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.sm }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: fontSize.body }}>{item.text}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  kpiIcon: { position: 'absolute', top: 10, right: 12, fontSize: 20 },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailBtn: { paddingVertical: 10, alignItems: 'center' },
  emptyBox: { padding: 20, alignItems: 'center' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
});
