import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { LoadingSpinner, EmptyState } from '../atoms';
import { ProviderCard } from '../molecules';
import { Text } from 'react-native';

export interface ProviderListProvider {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  services: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  distanceKm?: number;
  isAvailable: boolean;
}

export interface ProviderListProps {
  providers: ProviderListProvider[];
  isLoading?: boolean;
  onProviderPress: (id: string) => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement;
}

export function ProviderList({ providers, isLoading, onProviderPress, onEndReached, ListHeaderComponent }: ProviderListProps) {
  const { spacing } = useTheme();

  const renderItem = useCallback(({ item }: { item: ProviderListProvider }) => (
    <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
      <ProviderCard {...item} onPress={onProviderPress} />
    </View>
  ), [onProviderPress, spacing]);

  if (isLoading && providers.length === 0) return <LoadingSpinner size="lg" />;

  return (
    <FlatList
      data={providers}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>🔍</Text>}
          title="Aucun prestataire trouvé"
          description="Modifiez vos filtres ou votre zone de recherche."
        />
      }
      ListFooterComponent={isLoading ? <LoadingSpinner size="sm" /> : null}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      contentContainerStyle={{ paddingVertical: spacing.sm }}
    />
  );
}
