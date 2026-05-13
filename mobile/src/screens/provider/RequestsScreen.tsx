import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { useBookingStore } from '../../store/bookingStore';
import { Avatar, Badge, Button, EmptyState, LoadingSpinner } from '../../components/atoms';

export function RequestsScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { bookings, isLoading, fetchBookings } = useBookingStore();
  const [tab, setTab] = useState<'pending' | 'confirmed'>('pending');

  useEffect(() => { fetchBookings(); }, []);

  const filtered = bookings.filter(b =>
    tab === 'pending' ? b.status === 'PENDING' : b.status === 'CONFIRMED'
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.md }]}>
          Demandes
        </Text>
        <View style={[styles.tabs, { backgroundColor: colors.lightGray, borderRadius: radius.lg }]}>
          {(['pending', 'confirmed'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { backgroundColor: colors.primary, borderRadius: radius.md }]}
              onPress={() => setTab(t)}
            >
              <Text style={{ color: tab === t ? colors.white : colors.gray, fontWeight: '600', fontSize: fontSize.body }}>
                {t === 'pending' ? 'En attente' : 'Confirmées'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>📨</Text>}
          title="Aucune demande"
          description={tab === 'pending' ? 'Pas de nouvelles demandes.' : 'Aucune mission confirmée.'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, margin: spacing.sm, padding: spacing.md }]}>
              <View style={styles.row}>
                <Avatar size={40} name={item.clientName ?? 'Client'} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{item.serviceType}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                    {item.scheduledDate} — {item.scheduledTime}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{item.totalAmount} MAD</Text>
              </View>
              {tab === 'pending' && (
                <View style={[styles.row, { marginTop: spacing.sm, gap: spacing.sm }]}>
                  <Button variant="primary" size="sm" onPress={() => {}}>Confirmer</Button>
                  <Button variant="outline" size="sm" onPress={() => {}}>Refuser</Button>
                </View>
              )}
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
  tabs: { flexDirection: 'row', padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  card: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
