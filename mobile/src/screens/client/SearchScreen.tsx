import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { LoadingSpinner, EmptyState, Chip } from '../../components/atoms';

const SERVICE_FILTERS = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CLEANING', label: '🧹 Ménage' },
  { value: 'IRONING', label: '🧺 Repassage' },
  { value: 'DEEP_CLEANING', label: '🧼 Grand ménage' },
  { value: 'COOKING', label: '👨‍🍳 Cuisine' },
];

export function SearchScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const [query, setQuery]     = useState('');
  const [filter, setFilter]   = useState('ALL');
  const [isLoading]           = useState(false);
  const [results]             = useState<any[]>([]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.md }]}>
          Rechercher
        </Text>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Text style={{ fontSize: 18, marginRight: spacing.sm }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}
            placeholder="Rechercher un prestataire..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SERVICE_FILTERS}
          keyExtractor={item => item.value}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
            />
          )}
          style={{ marginTop: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>🔍</Text>}
          title="Aucun résultat"
          description="Modifiez votre recherche ou vos filtres."
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={() => null}
          contentContainerStyle={{ padding: spacing.md }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
});
