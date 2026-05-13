import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Button, Chip, Divider } from '../atoms';

export interface FilterValues {
  services: string[];
  maxDistance: number;
  minRating: number;
  maxPrice: number;
  availableOnly: boolean;
}

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialValues?: Partial<FilterValues>;
}

const SERVICES = [
  { value: 'CLEANING', label: '🧹 Ménage' },
  { value: 'IRONING', label: '🧺 Repassage' },
  { value: 'DEEP_CLEANING', label: '🧼 Grand ménage' },
  { value: 'POST_CONSTRUCTION', label: '🏗️ Post-chantier' },
  { value: 'COOKING', label: '👨‍🍳 Cuisine' },
];

const DISTANCES = [5, 10, 20, 50];
const RATINGS   = [3, 3.5, 4, 4.5];
const PRICES    = [50, 100, 150, 200];

export function FilterBottomSheet({ visible, onClose, onApply, initialValues }: FilterBottomSheetProps) {
  const { colors, spacing, fontSize, radius } = useTheme();

  const [services, setServices]         = useState<string[]>(initialValues?.services ?? []);
  const [maxDistance, setDistance]      = useState(initialValues?.maxDistance ?? 20);
  const [minRating, setRating]          = useState(initialValues?.minRating ?? 0);
  const [maxPrice, setPrice]            = useState(initialValues?.maxPrice ?? 200);
  const [availableOnly, setAvailable]   = useState(initialValues?.availableOnly ?? false);

  function toggleService(value: string) {
    setServices(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
  }

  function handleReset() {
    setServices([]);
    setDistance(20);
    setRating(0);
    setPrice(200);
    setAvailable(false);
  }

  function handleApply() {
    onApply({ services, maxDistance, minRating, maxPrice, availableOnly });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={[styles.header, { padding: spacing.md, borderBottomColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.h3 }}>Filtres</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={{ color: colors.primary, fontSize: fontSize.body }}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: '70%' }} contentContainerStyle={{ padding: spacing.md }}>
          <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>Services</Text>
          <View style={styles.chips}>
            {SERVICES.map(s => (
              <Chip key={s.value} label={s.label} selected={services.includes(s.value)} onPress={() => toggleService(s.value)} />
            ))}
          </View>

          <Divider />

          <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>Distance max</Text>
          <View style={styles.chips}>
            {DISTANCES.map(d => (
              <Chip key={d} label={`${d} km`} selected={maxDistance === d} onPress={() => setDistance(d)} />
            ))}
          </View>

          <Divider />

          <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>Note min</Text>
          <View style={styles.chips}>
            <Chip label="Toutes" selected={minRating === 0} onPress={() => setRating(0)} />
            {RATINGS.map(r => (
              <Chip key={r} label={`${r}★`} selected={minRating === r} onPress={() => setRating(r)} />
            ))}
          </View>

          <Divider />

          <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>Prix max/h</Text>
          <View style={styles.chips}>
            {PRICES.map(p => (
              <Chip key={p} label={`${p} MAD`} selected={maxPrice === p} onPress={() => setPrice(p)} />
            ))}
          </View>

          <Divider />

          <TouchableOpacity style={styles.toggle} onPress={() => setAvailable(v => !v)}>
            <Text style={{ color: colors.text, fontSize: fontSize.body }}>Disponibles uniquement</Text>
            <View style={[styles.switchTrack, { backgroundColor: availableOnly ? colors.primary : colors.border }]}>
              <View style={[styles.switchThumb, { backgroundColor: colors.white, transform: [{ translateX: availableOnly ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={{ padding: spacing.md }}>
          <Button variant="primary" size="lg" fullWidth onPress={handleApply}>Appliquer les filtres</Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  label: { fontWeight: '600', marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchTrack: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, elevation: 2 },
});
