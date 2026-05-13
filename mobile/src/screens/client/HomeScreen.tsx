import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { useTheme } from '../../theme';
import { Avatar, Badge, Button } from '../../components/atoms';
import { ProviderCard } from '../../components/molecules';
import { SearchBar } from '../../components/organisms';
import { useAuthStore } from '../../store/authStore';
import { useSearchStore } from '../../store/searchStore';
import { useNearbyProviders, Provider } from '../../hooks/api/useProviders';
import { useBookings, BookingData } from '../../hooks/api/useBookings';
import type { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SERVICES = [
  { type: 'CLEANING',          label: 'Ménage',        icon: '🧹' },
  { type: 'IRONING',           label: 'Repassage',     icon: '🧺' },
  { type: 'DEEP_CLEANING',     label: 'Grand ménage',  icon: '🧼' },
  { type: 'POST_CONSTRUCTION', label: 'Post-chantier', icon: '🏗️' },
] as const;

const ACTIVE_STATUSES: BookingData['status'][] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
const SkeletonCard = React.memo(function SkeletonCard() {
  const { colors, radius, spacing } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      accessibilityLabel="Chargement du prestataire"
      style={[
        {
          opacity: anim,
          backgroundColor: colors.lightGray,
          borderRadius: radius.lg,
          marginRight: spacing.sm + 4,
          width: 280,
          height: 148,
        },
      ]}
    />
  );
});

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------
export default function HomeScreen(): React.JSX.Element {
  const { colors, spacing, fontSize, radius } = useTheme();
  const navigation = useNavigation<NavProp>();

  const user = useAuthStore(s => s.user);
  const setQuery = useSearchStore(s => s.setQuery);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Localisation...');

  // Request location permission then resolve position + city name
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (cancelled) return;
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (!cancelled && place) {
          setLocationLabel(place.city ?? place.region ?? 'Ma position');
        }
      } catch {
        if (!cancelled) setLocationLabel('Ma position');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const {
    data: nearbyData,
    isLoading: loadingProviders,
    refetch: refetchProviders,
  } = useNearbyProviders(coords?.lat, coords?.lng);

  const { data: bookingPages, refetch: refetchBookings } = useBookings();

  // useNearbyProviders returns a plain page object (not infinite)
  const providers: Provider[] = nearbyData?.items ?? [];

  const activeBooking: BookingData | undefined = bookingPages?.pages
    .flatMap(p => p.items)
    .find(b => ACTIVE_STATUSES.includes(b.status));

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProviders(), refetchBookings()]);
    setRefreshing(false);
  }, [refetchProviders, refetchBookings]);

  const navigateToProviderDetail = useCallback(
    (id: string) => navigation.navigate('ProviderDetail', { providerId: id }),
    [navigation],
  );

  const navigateToSearch = useCallback(() => {
    (navigation as any).navigate('ClientTabs', { screen: 'Search' });
  }, [navigation]);

  const handleServicePress = useCallback(
    (serviceType: string) => {
      setQuery(serviceType);
      (navigation as any).navigate('ClientTabs', { screen: 'Search' });
    },
    [navigation, setQuery],
  );

  const statusVariant = (status: BookingData['status']): 'warning' | 'success' | 'info' => {
    if (status === 'PENDING') return 'warning';
    if (status === 'IN_PROGRESS') return 'success';
    return 'info';
  };

  const statusLabel = (status: BookingData['status']): string => {
    const map: Partial<Record<BookingData['status'], string>> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      IN_PROGRESS: 'En cours',
    };
    return map[status] ?? status;
  };

  const renderProvider = useCallback(
    ({ item }: { item: Provider }) => (
      <View style={{ width: 280, marginRight: 12 }}>
        <ProviderCard
          id={item.id}
          name={`${item.firstName} ${item.lastName}`}
          avatarUrl={item.avatarUrl}
          rating={item.averageRating}
          totalReviews={item.totalReviews}
          services={item.services.map(s => s.serviceType)}
          hourlyRateMin={item.hourlyRateMin}
          hourlyRateMax={item.hourlyRateMax}
          distanceKm={item.distanceKm}
          isAvailable={item.isAvailable}
          onPress={navigateToProviderDetail}
        />
      </View>
    ),
    [navigateToProviderDetail],
  );

  const userInitials = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : '';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.md }]}>
          <TouchableOpacity
            accessibilityLabel={`Localisation: ${locationLabel}`}
            onPress={navigateToSearch}
          >
            <Text style={[styles.locationText, { color: colors.text, fontSize: fontSize.body }]}>
              {'📍 '}{locationLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel={`Profil de ${userInitials || 'utilisateur'}`}
            onPress={() => (navigation as any).navigate('ClientTabs', { screen: 'Profile' })}
          >
            <Avatar
              uri={user?.avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="sm"
            />
          </TouchableOpacity>
        </View>

        {/* ── Greeting ── */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <Text style={[styles.greeting, { color: colors.text, fontSize: fontSize.h1 }]}>
            {'Bonjour'}{user?.firstName ? `, ${user.firstName}` : ''} {'👋'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginTop: 2 }}>
            Trouvez le meilleur prestataire près de vous
          </Text>
        </View>

        {/* ── Search shortcut (tappable, navigates to Search tab) ── */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
          <TouchableOpacity
            accessibilityLabel="Ouvrir la recherche de prestataires"
            activeOpacity={0.85}
            onPress={navigateToSearch}
          >
            <View
              style={[
                styles.searchShortcut,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text style={{ fontSize: 18, marginRight: spacing.sm }}>🔍</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
                Rechercher un prestataire...
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Active booking banner ── */}
        {activeBooking && (
          <View
            style={[
              styles.bookingBanner,
              {
                backgroundColor: colors.card,
                marginHorizontal: spacing.md,
                marginTop: spacing.md,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.bookingBannerRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={[styles.bannerTitle, { color: colors.text, fontSize: fontSize.body }]}>
                  Réservation active
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize.caption,
                    marginTop: 2,
                  }}
                >
                  {activeBooking.providerName} · {activeBooking.scheduledDate}
                </Text>
              </View>
              <Badge
                label={statusLabel(activeBooking.status)}
                variant={statusVariant(activeBooking.status)}
                size="sm"
              />
            </View>

            <View style={{ marginTop: spacing.sm }}>
              {activeBooking.status === 'PENDING' ? (
                <Button
                  variant="danger"
                  size="sm"
                  accessibilityLabel="Annuler la réservation"
                  onPress={() =>
                    navigation.navigate('BookingDetail', { bookingId: activeBooking.id })
                  }
                >
                  Annuler
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  accessibilityLabel="Voir les détails de la réservation"
                  onPress={() =>
                    navigation.navigate('BookingDetail', { bookingId: activeBooking.id })
                  }
                >
                  Voir détails
                </Button>
              )}
            </View>
          </View>
        )}

        {/* ── Nearby providers ── */}
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: fontSize.h3, paddingHorizontal: spacing.md },
            ]}
          >
            Prestataires recommandés
          </Text>

          {loadingProviders ? (
            <FlatList
              horizontal
              data={[1, 2, 3] as const}
              keyExtractor={item => String(item)}
              renderItem={() => <SkeletonCard />}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : providers.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize.body,
                paddingHorizontal: spacing.md,
                marginTop: spacing.sm,
              }}
            >
              Aucun prestataire trouvé près de vous.
            </Text>
          ) : (
            <FlatList
              horizontal
              data={providers}
              keyExtractor={item => item.id}
              renderItem={renderProvider}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, i) => ({ length: 292, offset: 292 * i, index: i })}
            />
          )}
        </View>

        {/* ── Popular services 2×2 grid ── */}
        <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.md }}>
          <Text
            style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.h3 }]}
          >
            Services populaires
          </Text>

          <View style={[styles.serviceGrid, { marginTop: spacing.sm, gap: 12 }]}>
            {SERVICES.map(svc => (
              <TouchableOpacity
                key={svc.type}
                accessibilityLabel={`Rechercher le service ${svc.label}`}
                activeOpacity={0.8}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: radius.lg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleServicePress(svc.type)}
              >
                <Text style={{ fontSize: 32 }}>{svc.icon}</Text>
                <Text
                  style={[
                    styles.serviceLabel,
                    { color: colors.text, fontSize: fontSize.caption, marginTop: 6 },
                  ]}
                >
                  {svc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: { fontWeight: '500' },
  greeting: { fontWeight: '700' },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  bookingBanner: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bannerTitle: { fontWeight: '600' },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1,
  },
  serviceLabel: { fontWeight: '500', textAlign: 'center' },
});
