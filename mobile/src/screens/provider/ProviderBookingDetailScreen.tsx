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
import { useBooking } from '../../hooks/api/useBookings';
import {
  useAcceptMission,
  useDeclineMission,
  useStartMission,
  useCompleteMission,
} from '../../hooks/api/useProviderMissions';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderBookingDetail'>;

const STATUS_LABEL: Record<string, string> = {
  PENDING:     'En attente',
  CONFIRMED:   'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED:   'Terminée',
  CANCELLED:   'Annulée',
  DISPUTED:    'Litige',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  PENDING:     'warning',
  CONFIRMED:   'info',
  IN_PROGRESS: 'info',
  COMPLETED:   'success',
  CANCELLED:   'danger',
  DISPUTED:    'danger',
};

const SERVICE_LABEL: Record<string, string> = {
  CLEANING:          'Ménage',
  IRONING:           'Repassage',
  DEEP_CLEANING:     'Grand nettoyage',
  POST_CONSTRUCTION: 'Post-chantier',
  COOKING:           'Cuisine',
};

function InfoRow({ icon, label, value, colors, fontSize, spacing }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.xs }}>
      <Text style={{ fontSize: 16, marginRight: spacing.sm, marginTop: 1 }}>{icon}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, width: 70 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.body, flex: 1 }}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value, bold, color, colors, fontSize, spacing }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs / 2 }}>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }}>{label}</Text>
      <Text style={{
        color: color ?? colors.text,
        fontSize: fontSize.body,
        fontWeight: bold ? '700' : '400',
      }}>
        {Number(value).toFixed(2)} MAD
      </Text>
    </View>
  );
}

export function ProviderBookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();

  const { data: booking, isLoading, refetch } = useBooking(bookingId);
  const { mutateAsync: acceptMission,  isPending: isAccepting  } = useAcceptMission();
  const { mutateAsync: declineMission, isPending: isDeclining  } = useDeclineMission();
  const { mutateAsync: startMission,   isPending: isStarting   } = useStartMission();
  const { mutateAsync: completeMission, isPending: isCompleting } = useCompleteMission();

  const navigateToChat = useCallback(() => {
    if (!booking) return;
    navigation.navigate('ProviderChat', {
      bookingId,
      participantName: booking.clientId, // name resolved from booking below
      participantId: booking.clientId,
    });
  }, [booking, bookingId, navigation]);

  const handleAccept = useCallback(() => {
    Alert.alert(
      'Accepter la mission',
      'Voulez-vous confirmer cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Accepter', onPress: async () => { await acceptMission(bookingId); } },
      ],
    );
  }, [bookingId, acceptMission]);

  const handleDecline = useCallback(() => {
    Alert.prompt(
      'Refuser la mission',
      'Raison (optionnel) :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async (reason?: string) => {
            await declineMission({ bookingId, reason });
            navigation.goBack();
          },
        },
      ],
      'plain-text',
    );
  }, [bookingId, declineMission, navigation]);

  const handleStart = useCallback(() => {
    Alert.alert(
      'Démarrer la mission',
      'Confirmez-vous le début de cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            await startMission(bookingId);
            navigation.navigate('ActiveMission', { bookingId });
          },
        },
      ],
    );
  }, [bookingId, startMission, navigation]);

  const handleComplete = useCallback(() => {
    Alert.alert(
      'Terminer la mission',
      'Confirmez-vous la fin de cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            await completeMission(bookingId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [bookingId, completeMission, navigation]);

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

  const timestamps: Partial<Record<string, string>> = {};
  if (booking.createdAt)   timestamps['PENDING']     = booking.createdAt;
  if (booking.startedAt)   timestamps['IN_PROGRESS'] = booking.startedAt;
  if (booking.completedAt) timestamps['COMPLETED']   = booking.completedAt;

  // Extract client name from booking — BookingData doesn't expose clientName directly,
  // so we derive a display name from the clientId for navigation fallback.
  const clientDisplayName = (booking as any).clientName ?? 'Client';
  const clientAvatarUrl   = (booking as any).clientAvatarUrl as string | undefined;
  const clientParts = clientDisplayName.split(' ');

  const isBusy = isAccepting || isDeclining || isStarting || isCompleting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize.h3 }]}>
          Détail de la mission
        </Text>
        <Badge
          label={STATUS_LABEL[booking.status] ?? booking.status}
          variant={STATUS_VARIANT[booking.status] ?? 'neutral'}
          size="sm"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Client info */}
        <View style={[styles.card, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.md }]}>
            Client & Service
          </Text>
          <View style={styles.row}>
            <Avatar
              firstName={clientParts[0]}
              lastName={clientParts[1] ?? ''}
              uri={clientAvatarUrl}
              size="md"
            />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>
                {clientDisplayName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                {SERVICE_LABEL[booking.serviceType] ?? booking.serviceType}
              </Text>
            </View>
          </View>
          <Divider />
          <InfoRow icon="📅" label="Date"    value={new Date(booking.scheduledDate).toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} colors={colors} fontSize={fontSize} spacing={spacing} />
          <InfoRow icon="🕐" label="Heure"   value={booking.scheduledTime} colors={colors} fontSize={fontSize} spacing={spacing} />
          <InfoRow icon="⏱"  label="Durée"   value={`${booking.durationHours}h`} colors={colors} fontSize={fontSize} spacing={spacing} />
          {(booking as any).address ? (
            <InfoRow icon="📍" label="Adresse" value={(booking as any).address} colors={colors} fontSize={fontSize} spacing={spacing} />
          ) : null}
          {booking.notes ? (
            <InfoRow icon="📝" label="Notes"   value={booking.notes} colors={colors} fontSize={fontSize} spacing={spacing} />
          ) : null}
        </View>

        {/* Timeline */}
        <View style={[styles.card, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Suivi de la mission
          </Text>
          <BookingTimeline
            currentStatus={booking.status as any}
            timestamps={timestamps as any}
          />
        </View>

        {/* Rémunération */}
        <View style={[styles.card, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Rémunération
          </Text>
          <PriceRow label="Montant total client" value={booking.totalAmount}    bold  colors={colors} fontSize={fontSize} spacing={spacing} />
          <PriceRow label="Commission plateforme" value={booking.commission}          colors={colors} fontSize={fontSize} spacing={spacing} />
          <Divider />
          <PriceRow
            label="Votre rémunération"
            value={booking.providerAmount}
            bold
            color={colors.success}
            colors={colors}
            fontSize={fontSize}
            spacing={spacing}
          />
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }}>
              Moyen de paiement
            </Text>
            <Text style={{ color: colors.text, fontSize: fontSize.caption, fontWeight: '600' }}>
              {booking.paymentMethod}
            </Text>
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
        <View style={[styles.card, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.xs }]}>
            Actions
          </Text>

          {booking.status === 'PENDING' && (
            <>
              <Button
                variant="success"
                size="lg"
                fullWidth
                loading={isAccepting}
                disabled={isBusy}
                onPress={handleAccept}
              >
                ✓ Accepter la mission
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                loading={isDeclining}
                disabled={isBusy}
                onPress={handleDecline}
              >
                ✗ Refuser la mission
              </Button>
            </>
          )}

          {booking.status === 'CONFIRMED' && (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isStarting}
                disabled={isBusy}
                onPress={handleStart}
              >
                ▶ Démarrer la mission
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                disabled={isBusy}
                onPress={() => navigation.navigate('ProviderChat', {
                  bookingId,
                  participantName: clientDisplayName,
                  participantId: booking.clientId,
                  participantAvatarUrl: clientAvatarUrl,
                })}
              >
                💬 Contacter le client
              </Button>
            </>
          )}

          {booking.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="success"
                size="lg"
                fullWidth
                loading={isCompleting}
                disabled={isBusy}
                onPress={handleComplete}
              >
                🏁 Terminer la mission
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                disabled={isBusy}
                onPress={() => navigation.navigate('ProviderChat', {
                  bookingId,
                  participantName: clientDisplayName,
                  participantId: booking.clientId,
                  participantAvatarUrl: clientAvatarUrl,
                })}
              >
                💬 Contacter le client
              </Button>
            </>
          )}

          {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
            <View style={[styles.readOnlyBox, {
              backgroundColor: colors.background,
              borderRadius: radius.md,
              padding: spacing.sm,
            }]}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, textAlign: 'center' }}>
                {booking.status === 'COMPLETED'
                  ? '✓ Mission terminée — aucune action requise.'
                  : '✗ Mission annulée.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center' },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontWeight: '700' },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontWeight: '700' },
  row:          { flexDirection: 'row', alignItems: 'center' },
  readOnlyBox:  { alignItems: 'center' },
});
