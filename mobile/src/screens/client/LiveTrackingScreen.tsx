import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getDatabase, onValue, ref } from 'firebase/database';
import { firebaseDatabase } from '../../services/firebase';
import { useTheme } from '../../theme';
import { Avatar, LoadingSpinner } from '../../components/atoms';
import { useBooking } from '../../hooks/api';
import type { RootStackParamList } from '../../navigation/types';

// Graceful import of react-native-maps
let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch {
  // maps not available — fallback UI will be used
}

type Props = NativeStackScreenProps<RootStackParamList, 'LiveTracking'>;

interface ProviderLocation {
  latitude: number;
  longitude: number;
}

/** Haversine great-circle distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock client coords — Casablanca city centre
const CLIENT_COORDS = { latitude: 33.5731, longitude: -7.5898 };

export function LiveTrackingScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const { data: booking, isLoading } = useBooking(bookingId);

  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeEta = useCallback((loc: ProviderLocation) => {
    const km = haversineKm(
      loc.latitude,
      loc.longitude,
      CLIENT_COORDS.latitude,
      CLIENT_COORDS.longitude,
    );
    // Assume ~30 km/h average urban speed
    setEtaMinutes(Math.max(1, Math.round((km / 30) * 60)));
  }, []);

  useEffect(() => {
    const locationRef = ref(firebaseDatabase, `bookings/${bookingId}/provider_location`);
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const val = snapshot.val() as ProviderLocation | null;
      if (val) {
        setProviderLocation(val);
        computeEta(val);
      }
    });

    // Refresh ETA every 30 s even without a new Firebase push
    etaIntervalRef.current = setInterval(() => {
      setProviderLocation((prev) => {
        if (prev) computeEta(prev);
        return prev;
      });
    }, 30_000);

    return () => {
      unsubscribe();
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
  }, [bookingId, computeEta]);

  const handleCall = useCallback(() => {
    Alert.alert('Appeler le prestataire', 'Voulez-vous appeler le prestataire ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Appeler', onPress: () => void Linking.openURL('tel:+212600000000') },
    ]);
  }, []);

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

  const mapRegion = {
    latitude: CLIENT_COORDS.latitude,
    longitude: CLIENT_COORDS.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const providerFirstName = booking.providerName.split(' ')[0] ?? '';
  const providerLastName  = booking.providerName.split(' ')[1] ?? '';

  return (
    <View style={styles.container}>
      {/* Map or graceful fallback */}
      {MapView != null ? (
        <MapView style={styles.map} initialRegion={mapRegion} showsUserLocation={false}>
          <Marker coordinate={CLIENT_COORDS} title="Votre adresse">
            <Text style={styles.markerEmoji}>📍</Text>
          </Marker>
          {providerLocation && (
            <Marker coordinate={providerLocation} title={booking.providerName}>
              <Text style={styles.markerEmoji}>🏠</Text>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={[styles.mapFallback, { backgroundColor: colors.lightGray }]}>
          <Text style={{ fontSize: 56 }}>🗺️</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.h2, marginTop: spacing.md }}>
            {booking.providerName}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: colors.primary, borderRadius: radius.full, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
            <Text style={{ color: colors.white, fontSize: fontSize.caption, fontWeight: '600' }}>
              En route vers votre adresse
            </Text>
          </View>
          {etaMinutes != null && (
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.md }}>
              Arrivée estimée : ~{etaMinutes} min
            </Text>
          )}
        </View>
      )}

      {/* Floating header overlay */}
      <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
        <View style={[styles.headerRow, { margin: spacing.md }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.full }]}
          >
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 28 }}>‹</Text>
          </TouchableOpacity>

          <View style={[styles.namePill, { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.body }}>
              {booking.providerName}
            </Text>
          </View>

          {etaMinutes != null && (
            <View style={[styles.etaPill, { backgroundColor: colors.success, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.caption }}>
                ~{etaMinutes} min
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg }]}>
        <View style={[styles.row, { marginBottom: spacing.md }]}>
          <Avatar
            firstName={providerFirstName}
            lastName={providerLastName}
            uri={booking.providerAvatarUrl}
            size="md"
            statusBadge="online"
          />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body }}>
              {booking.providerName}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
              En route vers votre adresse
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success, borderRadius: radius.lg, flex: 1, marginRight: spacing.sm }]}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.body }}>📞 Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: radius.lg, flex: 1, marginLeft: spacing.sm }]}
            onPress={() => navigation.navigate('Chat', {
              bookingId,
              participantName: booking.providerName,
              participantId: booking.providerId,
              participantAvatarUrl: booking.providerAvatarUrl,
            })}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.body }}>💬 Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map:           { flex: 1 },
  mapFallback:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow:     { flexDirection: 'row', alignItems: 'center' },
  iconBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  namePill:      { flex: 1 },
  etaPill:       { marginLeft: 8 },
  statusPill:    {},
  bottomSheet: {
    height: 160,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  row:       { flexDirection: 'row', alignItems: 'center' },
  markerEmoji: { fontSize: 28 },
  actionBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
