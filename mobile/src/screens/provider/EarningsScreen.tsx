import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';
import { Button, Divider, LoadingSpinner } from '../../components/atoms';
import { api } from '../../services/api';

interface EarningsSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalMissions: number;
}

export function EarningsScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const [summary, setSummary]       = useState<EarningsSummary | null>(null);
  const [isLoading, setLoading]     = useState(true);
  const [withdrawAmount, setAmount] = useState('');
  const [withdrawing, setWithdraw]  = useState(false);

  useEffect(() => {
    api.get('/earnings/summary')
      .then(r => setSummary(r.data.data))
      .catch(() => setSummary({ availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalMissions: 0 }))
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) { Alert.alert('Erreur', 'Le montant minimum est 100 MAD'); return; }
    if (summary && amount > summary.availableBalance) { Alert.alert('Erreur', 'Solde insuffisant'); return; }
    setWithdraw(true);
    try {
      await api.post('/earnings/withdraw', { amount });
      Alert.alert('Succès', 'Demande de retrait envoyée');
      setAmount('');
    } catch {
      Alert.alert('Erreur', 'Impossible de traiter le retrait');
    } finally {
      setWithdraw(false);
    }
  }

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={{ padding: spacing.md }}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.lg }]}>
            Revenus
          </Text>

          <View style={[styles.card, { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md }]}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: fontSize.caption }}>Solde disponible</Text>
            <Text style={{ color: colors.white, fontSize: 36, fontWeight: '700', marginTop: 4 }}>
              {summary?.availableBalance.toFixed(2)} MAD
            </Text>
          </View>

          <View style={[styles.statsRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
            {[
              { label: 'En attente', value: `${summary?.pendingBalance.toFixed(0)} MAD`, color: colors.warning },
              { label: 'Total gagné', value: `${summary?.totalEarned.toFixed(0)} MAD`, color: colors.success },
              { label: 'Missions', value: String(summary?.totalMissions), color: colors.primary },
            ].map(stat => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, flex: 1 }]}>
                <Text style={{ color: stat.color, fontWeight: '700', fontSize: fontSize.h3 }}>{stat.value}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Divider label="Retrait" />

          <View style={[styles.withdrawCard, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }]}>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: spacing.sm }}>Demander un retrait</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md, color: colors.text }]}
              value={withdrawAmount}
              onChangeText={setAmount}
              placeholder="Montant (min. 100 MAD)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Button variant="primary" size="md" fullWidth loading={withdrawing} onPress={handleWithdraw}>
              Retirer
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  card: { elevation: 2, shadowColor: '#2980B9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  statsRow: { flexDirection: 'row' },
  statCard: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  withdrawCard: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  input: { borderWidth: 1, padding: 12, marginBottom: 12, fontSize: 15 },
});
