import React, { useCallback } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Avatar, Badge, Button, Divider, LoadingSpinner } from '../../components/atoms';
import { BookingTimeline } from '../../components/organisms';
import { useBooking, useCancelBooking } from '../../hooks/api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  DISPUTED: 'danger',
};

export function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const { data: booking, isLoading, refetch } = useBooking(bookingId);
  const { mutateAsync: cancelBooking, isPending: isCancelling } = useCancelBooking();

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => { await cancelBooking(bookingId); },
        },
      ],
    );
  }, [bookingId, cancelBooking]);

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

  const timestamps: Partial<Record<string, string>> = {};
  if (booking.createdAt) timestamps['PENDING'] = booking.createdAt;
  if (booking.startedAt) timestamps['IN_PROGRESS'] = booking.startedAt;
  if (booking.completedAt) timestamps['COMPLETED'] = booking.completedAt;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize.h3 }]}>
          Détail réservation
        </Text>
        <Badge
          label={STATUS_LABEL[booking.status] ?? booking.status}
          variant={STATUS_VARIANT[booking.status] ?? 'neutral'}
          size="sm"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Suivi de la réservation
          </Text>
          <BookingTimeline
            currentStatus={booking.status as any}
            timestamps={timestamps as any}
          />
        </View>

        {/* Provider info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.md }]}>
            Prestataire & Service
          </Text>
          <View style={styles.row}>
            <Avatar
              firstName={booking.providerName.split(' ')[0]}
              lastName={booking.providerName.split(' ')[1] ?? ''}
              uri={booking.providerAvatarUrl}
              size="md"
            />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{booking.providerName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>{booking.serviceType}</Text>
            </View>
          </View>
          <Divider />
          <InfoRow icon="📅" label="Date"  value={new Date(booking.scheduledDate).toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} colors={colors} fontSize={fontSize} spacing={spacing} />
          <InfoRow icon="🕐" label="Heure" value={booking.scheduledTime} colors={colors} fontSize={fontSize} spacing={spacing} />
          <InfoRow icon="⏱"  label="Durée" value={`${booking.durationHours}h`} colors={colors} fontSize={fontSize} spacing={spacing} />
          {booking.notes ? <InfoRow icon="📝" label="Notes" value={booking.notes} colors={colors} fontSize={fontSize} spacing={spacing} /> : null}
        </View>

        {/* Price */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.md }]}>
            Récapitulatif paiement
          </Text>
          <PriceRow label="Total"                   value={booking.totalAmount}    bold colors={colors} fontSize={fontSize} spacing={spacing} />
          <PriceRow label="Commission plateforme"   value={booking.commission}     colors={colors} fontSize={fontSize} spacing={spacing} />
          <PriceRow label="Montant prestataire"     value={booking.providerAmount} colors={colors} fontSize={fontSize} spacing={spacing} />
          <Divider />
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }}>Moyen de paiement</Text>
            <Text style={{ color: colors.text, fontSize: fontSize.caption, fontWeight: '600' }}>{booking.paymentMethod}</Text>
            <View style={{ marginLeft: spacing.sm }}>
              <Badge
                label={booking.paymentStatus === 'PAID' ? 'Payé' : booking.paymentStatus === 'PENDING' ? 'En attente' : booking.paymentStatus}
                variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.xs }]}>
            Actions
          </Text>

          {booking.status === 'PENDING' && (
            <Button variant="danger" size="lg" fullWidth loading={isCancelling} onPress={handleCancel}>
              Annuler la réservation
            </Button>
          )}

          {booking.status === 'CONFIRMED' && (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => navigation.navigate('Chat', {
                  bookingId,
                  participantName: booking.providerName,
                  participantId: booking.providerId,
                  participantAvatarUrl: booking.providerAvatarUrl,
                })}
              >
                Contacter le prestataire
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => Alert.alert('Carte', 'Affichage de la carte — bientôt disponible.')}
              >
                Voir sur carte
              </Button>
            </>
          )}

          {booking.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => navigation.navigate('LiveTracking', { bookingId })}
              >
                Suivi en direct
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => navigation.navigate('Chat', {
                  bookingId,
                  participantName: booking.providerName,
                  participantId: booking.providerId,
                  participantAvatarUrl: booking.providerAvatarUrl,
                })}
              >
                Contacter le prestataire
              </Button>
            </>
          )}

          {booking.status === 'COMPLETED' && (
            <>
              {!booking.hasReview && (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onPress={() => navigation.navigate('Review', {
                    bookingId,
                    providerName: booking.providerName,
                    providerAvatarUrl: booking.providerAvatarUrl,
                  })}
                >
                  Laisser un avis
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onPress={() => Alert.alert('Re-réserver', 'Fonctionnalité bientôt disponible.')}
              >
                Re-réserver
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors, fontSize, spacing }: any) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }]}>
      <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{icon}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, width: 64 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.body, flex: 1 }}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value, bold, colors, fontSize, spacing }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs / 2 }}>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.body, fontWeight: bold ? '700' : '400' }}>
        {Number(value).toFixed(2)} MAD
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontWeight: '700' },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
