import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { COLORS, BOOKING_STATUS_LABELS } from '../../constants';
import { Booking } from '../../../../shared/types';

/**
 * Écran d'accueil du client — liste ses réservations récentes.
 */
export default function HomeScreen(): React.JSX.Element {
  const { user } = useAuthStore();
  const { bookings, isLoading, fetchBookings } = useBookingStore();

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const renderBooking = ({ item }: { item: Booking }): React.JSX.Element => (
    <View style={styles.card}>
      <Text style={styles.serviceName}>{item.service?.name ?? '—'}</Text>
      <Text style={styles.date}>
        {new Date(item.scheduledAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
        <Text style={styles.badgeText}>{BOOKING_STATUS_LABELS[item.status] ?? item.status}</Text>
      </View>
      <Text style={styles.price}>{Number(item.totalPrice).toFixed(2)} MAD</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Bonjour, {user?.firstName} 👋</Text>
      <Text style={styles.sectionTitle}>Mes réservations</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void fetchBookings()} />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
          ) : (
            <Text style={styles.empty}>Aucune réservation pour le moment.</Text>
          )
        }
      />
    </View>
  );
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: COLORS.warning,
    CONFIRMED: COLORS.primary,
    IN_PROGRESS: COLORS.success,
    COMPLETED: COLORS.success,
    CANCELLED: COLORS.danger,
    DISPUTED: COLORS.danger,
  };
  return map[status] ?? COLORS.gray;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  sectionTitle: { fontSize: 16, color: COLORS.gray, marginBottom: 16 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceName: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  date: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.gray, marginTop: 32, fontSize: 15 },
});
