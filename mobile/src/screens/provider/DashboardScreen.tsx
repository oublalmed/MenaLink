import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { api } from '../../services/api';
import { COLORS, BOOKING_STATUS_LABELS } from '../../constants';
import { Booking, BookingStatus } from '../../../../shared/types';

/**
 * Tableau de bord du prestataire — liste les missions assignées.
 */
export default function DashboardScreen(): React.JSX.Element {
  const { user } = useAuthStore();
  const { bookings, isLoading, fetchBookings } = useBookingStore();
  const [isAvailable, setIsAvailable] = React.useState(true);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const toggleAvailability = async (value: boolean): Promise<void> => {
    setIsAvailable(value);
    try {
      await api.put('/providers/profile', { isAvailable: value });
    } catch {
      setIsAvailable(!value);
    }
  };

  const confirmBooking = async (bookingId: string): Promise<void> => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: BookingStatus.CONFIRMED });
      await fetchBookings();
    } catch {
      // Erreur gérée par l'API
    }
  };

  const renderBooking = ({ item }: { item: Booking }): React.JSX.Element => (
    <View style={styles.card}>
      <Text style={styles.serviceName}>{item.service?.name ?? '—'}</Text>
      <Text style={styles.address}>{item.address?.street}, {item.address?.city}</Text>
      <Text style={styles.date}>
        {new Date(item.scheduledAt).toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
      <Text style={styles.price}>{Number(item.totalPrice).toFixed(2)} MAD</Text>

      {item.status === BookingStatus.PENDING && (
        <TouchableOpacity style={styles.confirmBtn} onPress={() => void confirmBooking(item.id)}>
          <Text style={styles.confirmBtnText}>Accepter la mission</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user?.firstName}</Text>
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>Disponible</Text>
          <Switch
            value={isAvailable}
            onValueChange={(v) => void toggleAvailability(v)}
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Mes missions</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => void fetchBookings()}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
          ) : (
            <Text style={styles.empty}>Aucune mission assignée.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityLabel: { fontSize: 14, color: COLORS.gray },
  sectionTitle: { fontSize: 16, color: COLORS.gray, marginBottom: 12 },
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
  address: { fontSize: 13, color: COLORS.gray, marginBottom: 4 },
  date: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  confirmBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  empty: { textAlign: 'center', color: COLORS.gray, marginTop: 32 },
});
