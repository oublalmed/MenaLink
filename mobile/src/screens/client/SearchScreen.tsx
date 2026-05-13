import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
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
import { EmptyState, LoadingSpinner } from '../../components/atoms';
import { ProviderCard } from '../../components/molecules';
import { FilterBottomSheet, SearchBar, ProviderMap } from '../../components/organisms';
import { useSearchStore } from '../../store/searchStore';
import { useProviders, Provider } from '../../hooks/api/useProviders';
import type { FilterValues } from '../../components/organisms/FilterBottomSheet';
import type { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ---------------------------------------------------------------------------
// SearchScreen
// ---------------------------------------------------------------------------
export const SearchScreen = React.memo(function SearchScreen(): React.JSX.Element {
  const { colors, spacing, fontSize, radius } = useTheme();
  const navigation = useNavigation<NavProp>();

  const {
    query,
    filters,
    viewMode,
    activeFilterCount,
    setQuery,
    setFilters,
    setViewMode,
  } = useSearchStore();

  const [filterOpen, setFilterOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request location once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!cancelled) {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProviders({
    query: query || undefined,
    serviceType: filters.serviceTypes[0] || undefined,
    minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
    minRating: filters.minRating > 0 ? filters.minRating : undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: filters.radiusKm !== 20 ? filters.radiusKm : undefined,
  });

  const providers: Provider[] = data?.pages.flatMap(p => p.items) ?? [];

  // Map-compatible shape (only providers with coordinates)
  const mapProviders = providers
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      latitude: p.latitude!,
      longitude: p.longitude!,
      rating: p.averageRating,
      hourlyRateMin: p.hourlyRateMin,
      isAvailable: p.isAvailable,
    }));

  const handleApplyFilter = useCallback(
    (f: FilterValues) => {
      setFilters({
        serviceTypes: f.services,
        minRating: f.minRating,
        minPrice: 0,
        maxPrice: f.maxPrice,
        verifiedOnly: false,
        radiusKm: f.maxDistance,
        availableDate: null,
      });
      setFilterOpen(false);
    },
    [setFilters],
  );

  const navigateToProvider = useCallback(
    (id: string) => navigation.navigate('ProviderDetail', { providerId: id }),
    [navigation],
  );

  const renderProvider = useCallback(
    ({ item }: { item: Provider }) => (
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
        onPress={navigateToProvider}
      />
    ),
    [navigateToProvider],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const resultCountText =
    providers.length === 1
      ? '1 prestataire trouvé'
      : `${providers.length} prestataires trouvés`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header + search bar + toggles ── */}
      <View
        style={[
          styles.headerBlock,
          { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: fontSize.h2 }]}>
          Recherche
        </Text>

        <View style={{ marginTop: spacing.sm }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onFilterPress={() => setFilterOpen(true)}
            filterCount={activeFilterCount}
          />
        </View>

        {/* ── Segmented view toggle ── */}
        <View style={[styles.toggleRow, { marginTop: spacing.sm }]}>
          <TouchableOpacity
            accessibilityLabel="Affichage en liste"
            accessibilityState={{ selected: viewMode === 'list' }}
            activeOpacity={0.8}
            onPress={() => setViewMode('list')}
            style={[
              styles.toggleBtn,
              styles.toggleLeft,
              {
                backgroundColor: viewMode === 'list' ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.toggleLabel,
                {
                  color: viewMode === 'list' ? colors.white : colors.textSecondary,
                  fontSize: fontSize.body,
                },
              ]}
            >
              {'📋 Liste'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Affichage sur la carte"
            accessibilityState={{ selected: viewMode === 'map' }}
            activeOpacity={0.8}
            onPress={() => setViewMode('map')}
            style={[
              styles.toggleBtn,
              styles.toggleRight,
              {
                backgroundColor: viewMode === 'map' ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.toggleLabel,
                {
                  color: viewMode === 'map' ? colors.white : colors.textSecondary,
                  fontSize: fontSize.body,
                },
              ]}
            >
              {'🗺️ Carte'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Result count ── */}
        {!isLoading && (
          <Text
            style={[
              styles.resultCount,
              { color: colors.textSecondary, fontSize: fontSize.caption, marginTop: spacing.xs },
            ]}
          >
            {resultCountText}
          </Text>
        )}
      </View>

      {/* ── Main content ── */}
      {isLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner size="lg" />
        </View>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>🔍</Text>}
          title="Aucun résultat"
          description="Essayez d'élargir votre zone de recherche ou de modifier vos filtres."
        />
      ) : viewMode === 'list' ? (
        // ── List view ──────────────────────────────────────────────────────
        <FlatList
          data={providers}
          keyExtractor={item => item.id}
          renderItem={renderProvider}
          contentContainerStyle={{ padding: spacing.md }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          onRefresh={refetch}
          refreshing={isLoading}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.md }}>
                <LoadingSpinner size="sm" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // ── Map view ───────────────────────────────────────────────────────
        <View style={{ flex: 1 }}>
          <ProviderMap
            providers={mapProviders}
            initialLatitude={coords?.lat}
            initialLongitude={coords?.lng}
            onProviderPress={navigateToProvider}
            height={400}
          />

          {/* Horizontally scrollable preview of first 3 providers */}
          {providers.length > 0 && (
            <View
              style={[
                styles.mapBottomSheet,
                {
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.mapSheetTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize.caption,
                    paddingHorizontal: spacing.md,
                    paddingTop: spacing.sm,
                  },
                ]}
              >
                À proximité
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: spacing.md,
                  paddingBottom: spacing.sm,
                  paddingTop: spacing.xs,
                }}
              >
                {providers.slice(0, 3).map(item => (
                  <View key={item.id} style={{ width: 260, marginRight: spacing.sm }}>
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
                      onPress={navigateToProvider}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* ── Filter bottom sheet ── */}
      <FilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        initialValues={{
          services: filters.serviceTypes,
          maxDistance: filters.radiusKm,
          minRating: filters.minRating,
          maxPrice: filters.maxPrice,
          availableOnly: false,
        }}
      />
    </SafeAreaView>
  );
});

export default SearchScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBlock: {},
  screenTitle: { fontWeight: '700' },
  toggleRow: { flexDirection: 'row' },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
  },
  toggleRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleLabel: { fontWeight: '600' },
  resultCount: {},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapBottomSheet: {
    borderTopWidth: 1,
    maxHeight: 230,
  },
  mapSheetTitle: { fontWeight: '600' },
});
