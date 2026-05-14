import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { useBookingStore } from '../../store/bookingStore';
import { LoadingSpinner, EmptyState, Chip } from '../../components/atoms';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#E67E22',
  CONFIRMED: '#E8963A',
  IN_PROGRESS: '#8E44AD',
  COMPLETED: '#27AE60',
  CANCELLED: '#E74C3C',
  DISPUTED: '#C0392B',
};

export function BookingsScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { bookings, isLoading, fetchBookings } = useBookingStore();
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchBookings(); }, []);

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.md }]}>
          Mes réservations
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={item => item.value}
          renderItem={({ item }) => (
            <Chip label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />
          )}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>📋</Text>}
          title="Aucune réservation"
          description="Vous n'avez pas encore de réservation dans cette catégorie."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, margin: spacing.sm, padding: spacing.md }]}>
              <View style={styles.row}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body, flex: 1 }}>
                  {item.serviceType ?? 'Service'}
                </Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20', borderRadius: radius.sm }]}>
                  <Text style={{ color: STATUS_COLORS[item.status], fontSize: fontSize.caption, fontWeight: '600' }}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: spacing.xs }}>
                {item.scheduledDate} à {item.scheduledTime} — {item.durationHours}h
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', marginTop: spacing.xs }}>
                {item.totalAmount} MAD
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: spacing.sm }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  card: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
});
