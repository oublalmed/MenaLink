import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { MapMarker } from '../molecules';

export interface MapProvider {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  hourlyRateMin: number;
  isAvailable: boolean;
}

export interface ProviderMapProps {
  providers: MapProvider[];
  initialLatitude?: number;
  initialLongitude?: number;
  selectedProviderId?: string;
  onProviderPress: (id: string) => void;
  height?: number;
}

export function ProviderMap({
  providers,
  initialLatitude = 33.5992,
  initialLongitude = -7.6328,
  selectedProviderId,
  onProviderPress,
  height = 300,
}: ProviderMapProps) {
  const { colors, radius, spacing } = useTheme();

  // react-native-maps is a native peer dep; render a placeholder when not available
  let MapView: any = null;
  let Marker: any  = null;
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker  = maps.Marker;
  } catch {
    // not installed — show placeholder
  }

  if (!MapView) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: colors.lightGray, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 40 }}>🗺️</Text>
        <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>{providers.length} prestataire(s) à proximité</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ height, borderRadius: radius.lg }}
      initialRegion={{ latitude: initialLatitude, longitude: initialLongitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
    >
      {providers.map(p => (
        <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} onPress={() => onProviderPress(p.id)}>
          <MapMarker
            type={p.id === selectedProviderId ? 'selected' : 'provider'}
            name={p.name}
            price={p.hourlyRateMin}
          />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeholder: { overflow: 'hidden' },
});
