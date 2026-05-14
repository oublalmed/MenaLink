import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Badge, Divider, EmptyState, LoadingSpinner } from '../../components/atoms';
import {
  useEarningsSummary,
  useEarningsTransactions,
} from '../../hooks/api/useEarnings';
import type { ProviderTabsParamList, RootStackParamList } from '../../navigation/types';

type EarningsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<ProviderTabsParamList, 'Earnings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TabKey = "Aujourd'hui" | 'Semaine' | 'Mois' | 'Total';
const TABS: TabKey[] = ["Aujourd'hui", 'Semaine', 'Mois', 'Total'];

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOCK_WEEK_DATA = [320, 0, 580, 240, 760, 410, 190];

const TX_ICON: Record<string, string> = {
  PAYMENT: '💳',
  REFUND: '💸',
  WITHDRAWAL: '💸',
  COMMISSION: '📊',
};

function formatAmount(n: number) {
  return n.toFixed(2) + ' MAD';
}

function formatDate(iso: string) {
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

export function EarningsScreen() {
  const navigation = useNavigation<EarningsNavProp>();
  const { colors, spacing, fontSize, radius } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("Aujourd'hui");

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useEarningsSummary();
  const {
    data: txPages,
    isLoading: txLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchTx,
  } = useEarningsTransactions();

  const transactions = useMemo(
    () => txPages?.pages.flatMap((p) => p.items) ?? [],
    [txPages],
  );

  // Animated bar heights — staggered 60 ms per bar
  const barAnims = useRef(WEEK_DAYS.map(() => new Animated.Value(0))).current;
  const maxAmount = Math.max(...MOCK_WEEK_DATA, 1);

  useEffect(() => {
    const animations = WEEK_DAYS.map((_, i) =>
      Animated.timing(barAnims[i], {
        toValue: (MOCK_WEEK_DATA[i] / maxAmount) * 80,
        duration: 400,
        delay: i * 60,
        useNativeDriver: false,
      }),
    );
    Animated.parallel(animations).start();
  }, [barAnims, maxAmount]);

  const heroAmount = useMemo(() => {
    if (!summary) return 0;
    switch (activeTab) {
      case "Aujourd'hui": return summary.availableBalance * 0.12;
      case 'Semaine':     return summary.availableBalance * 0.35;
      case 'Mois':        return summary.totalEarned * 0.28;
      case 'Total':       return summary.totalEarned;
    }
  }, [activeTab, summary]);

  const handleRefresh = useCallback(() => {
    void refetchSummary();
    void refetchTx();
  }, [refetchSummary, refetchTx]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (summaryLoading && !summary) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View>
      {/* Screen header */}
      <View style={[styles.screenHeader, {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
      }]}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: fontSize.h2 }]}>
          Revenus
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Withdrawal')}
          style={[styles.withdrawBtn, { backgroundColor: colors.primary, borderRadius: radius.lg }]}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: fontSize.caption, fontWeight: '700' }}>
            Demander un virement
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab ? colors.primary : colors.card,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs + 2,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={{
              color: activeTab === tab ? '#fff' : colors.textSecondary,
              fontSize: fontSize.caption,
              fontWeight: '600',
            }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hero card */}
      <View style={[styles.heroCard, {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.lg,
      }]}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: fontSize.caption }}>
          Solde disponible
        </Text>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 }}>
          {formatAmount(heroAmount)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: fontSize.caption, marginTop: spacing.xs }}>
          En attente: {formatAmount(summary?.pendingBalance ?? 0)}
        </Text>
      </View>

      {/* Weekly bar chart */}
      <View style={[styles.chartCard, {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
      }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.md }]}>
          Cette semaine
        </Text>
        <View style={styles.barsRow}>
          {WEEK_DAYS.map((day, i) => (
            <View key={day} style={styles.barCol}>
              {MOCK_WEEK_DATA[i] > 0 && (
                <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '700', marginBottom: 2 }}>
                  {MOCK_WEEK_DATA[i]}
                </Text>
              )}
              <Animated.View
                style={{
                  height: barAnims[i],
                  width: 20,
                  backgroundColor: colors.primary,
                  borderRadius: radius.sm,
                  opacity: MOCK_WEEK_DATA[i] > 0 ? 1 : 0.15,
                  minHeight: 3,
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <Divider label="Transactions" />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={summaryLoading || txLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          !txLoading ? (
            <EmptyState
              icon={<Text style={{ fontSize: 40 }}>📊</Text>}
              title="Aucune transaction"
              description="Vos transactions apparaîtront ici."
            />
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: spacing.md, alignItems: 'center' }}>
              <LoadingSpinner size="sm" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isPositive = item.type === 'PAYMENT';
          const isNegative = item.type === 'WITHDRAWAL' || item.type === 'COMMISSION';
          const amountColor = isPositive
            ? colors.success
            : isNegative
            ? colors.danger
            : colors.warning;
          const sign = isPositive ? '+' : '-';
          return (
            <View style={[styles.txRow, {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
            }]}>
              <View style={[styles.txIconWrap, {
                backgroundColor: colors.background,
                borderRadius: radius.full,
              }]}>
                <Text style={{ fontSize: 20 }}>{TX_ICON[item.type] ?? '💳'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text
                  style={{ color: colors.text, fontSize: fontSize.body, fontWeight: '500' }}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: amountColor, fontSize: fontSize.body, fontWeight: '700' }}>
                  {sign}{formatAmount(Math.abs(item.amount))}
                </Text>
                {(item.status === 'PENDING' || item.status === 'FAILED') && (
                  <Badge
                    label={item.status === 'PENDING' ? 'En attente' : 'Échoué'}
                    variant={item.status === 'PENDING' ? 'warning' : 'danger'}
                    size="sm"
                  />
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle:  { fontWeight: '800' },
  withdrawBtn:  { paddingHorizontal: 12, paddingVertical: 7 },
  tab:          { alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    shadowColor: '#E8963A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  chartCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  barsRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 110 },
  barCol:     { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  sectionTitle: { fontWeight: '700' },
  txRow:      { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  txIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
