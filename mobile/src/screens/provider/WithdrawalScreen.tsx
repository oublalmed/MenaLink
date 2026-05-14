import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Badge, Button, Divider, Input, LoadingSpinner } from '../../components/atoms';
import {
  useEarningsSummary,
  useRequestWithdrawal,
  useWithdrawals,
} from '../../hooks/api/useEarnings';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Withdrawal'>;

const QUICK_AMOUNTS = [100, 250, 500] as const;

const MOCK_RIBS = [
  { id: 'rib1', bank: 'CIH Bank', maskedIban: '****  ****  ****  1234' },
  { id: 'rib2', bank: 'Attijariwafa Bank', maskedIban: '****  ****  ****  5678' },
];

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  PROCESSED: 'success',
  REJECTED: 'danger',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSED: 'Traité',
  REJECTED: 'Rejeté',
};

function formatAmount(n: number) {
  return n.toFixed(2) + ' MAD';
}
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export function WithdrawalScreen({ navigation }: Props) {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { data: summary, isLoading: summaryLoading } = useEarningsSummary();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useWithdrawals();
  const { mutateAsync: requestWithdrawal, isPending } = useRequestWithdrawal();

  const [amountText, setAmountText] = useState('');
  const [selectedRib, setSelectedRib] = useState<string>('rib1');
  const [showNewRib, setShowNewRib] = useState(false);
  const [newBank, setNewBank] = useState('');
  const [newIban, setNewIban] = useState('');
  const [newBic, setNewBic] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const available = summary?.availableBalance ?? 0;
  const amount = parseFloat(amountText) || 0;
  const tooLow = amountText.length > 0 && amount < 100;
  const tooHigh = amountText.length > 0 && amount > available;
  const isValid = amount >= 100 && amount <= available;

  const handleQuickAmount = useCallback((val: number | 'Tout') => {
    const n = val === 'Tout' ? available : val;
    setAmountText(String(n));
  }, [available]);

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    const ribLabel = showNewRib
      ? `${newBank} — ${newIban}`
      : MOCK_RIBS.find((r) => r.id === selectedRib)?.bank ?? '';
    Alert.alert(
      'Confirmer le virement',
      `Montant: ${formatAmount(amount)}\nVers: ${ribLabel}\n\nCe virement sera traité sous 24-48h ouvrés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await requestWithdrawal(amount);
              navigation.goBack();
            } catch { /* toast already shown by hook */ }
          },
        },
      ],
    );
  }, [isValid, amount, selectedRib, showNewRib, newBank, newIban, requestWithdrawal, navigation]);

  if (summaryLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize.h3 }]}>
          Demande de virement
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Available balance hero */}
          <View style={[styles.card, {
            backgroundColor: colors.primary,
            borderRadius: radius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
            alignItems: 'center',
          }]}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: fontSize.caption }}>
              Disponible pour retrait
            </Text>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4 }}>
              {formatAmount(available)}
            </Text>
          </View>

          {/* Amount input */}
          <View style={[styles.card, {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
            alignItems: 'center',
          }]}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: spacing.sm }}>
              Montant à retirer (MAD)
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              style={[styles.amountInput, {
                color: colors.text,
                borderBottomColor: tooLow || tooHigh ? colors.danger : colors.primary,
                fontSize: 32,
              }]}
              textAlign="center"
            />
            {tooLow && (
              <Text style={{ color: colors.danger, fontSize: fontSize.caption, marginTop: spacing.xs }}>
                Minimum 100 MAD
              </Text>
            )}
            {tooHigh && (
              <Text style={{ color: colors.danger, fontSize: fontSize.caption, marginTop: spacing.xs }}>
                Solde insuffisant
              </Text>
            )}

            {/* Quick amount pills */}
            <View style={[styles.pillsRow, { marginTop: spacing.md }]}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => handleQuickAmount(val)}
                  style={[styles.pill, {
                    backgroundColor: amount === val ? colors.primary : colors.background,
                    borderColor: amount === val ? colors.primary : colors.border,
                    borderRadius: radius.full,
                  }]}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    color: amount === val ? '#fff' : colors.text,
                    fontSize: fontSize.caption,
                    fontWeight: '600',
                  }}>
                    {val} MAD
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => handleQuickAmount('Tout')}
                style={[styles.pill, {
                  backgroundColor: amount === available && available > 0 ? colors.primary : colors.background,
                  borderColor: amount === available && available > 0 ? colors.primary : colors.border,
                  borderRadius: radius.full,
                }]}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: amount === available && available > 0 ? '#fff' : colors.text,
                  fontSize: fontSize.caption,
                  fontWeight: '600',
                }}>
                  Tout
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RIB selection */}
          <View style={[styles.card, {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
              Compte bancaire
            </Text>

            {MOCK_RIBS.map((rib) => (
              <TouchableOpacity
                key={rib.id}
                onPress={() => { setSelectedRib(rib.id); setShowNewRib(false); }}
                style={[styles.ribRow, {
                  borderColor: selectedRib === rib.id && !showNewRib ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                }]}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, {
                  borderColor: selectedRib === rib.id && !showNewRib ? colors.primary : colors.border,
                }]}>
                  {selectedRib === rib.id && !showNewRib && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{rib.bank}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{rib.maskedIban}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* New RIB option */}
            <TouchableOpacity
              onPress={() => { setShowNewRib(true); setSelectedRib(''); }}
              style={[styles.ribRow, {
                borderColor: showNewRib ? colors.primary : colors.border,
                borderRadius: radius.md,
                padding: spacing.sm,
                marginBottom: showNewRib ? spacing.sm : 0,
              }]}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, {
                borderColor: showNewRib ? colors.primary : colors.border,
              }]}>
                {showNewRib && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.body, marginLeft: spacing.sm }}>
                ➕ Nouveau RIB
              </Text>
            </TouchableOpacity>

            {showNewRib && (
              <View style={{ gap: spacing.sm }}>
                <Input
                  label="Banque"
                  value={newBank}
                  onChangeText={setNewBank}
                  placeholder="Ex: CIH Bank"
                />
                <Input
                  label="IBAN"
                  value={newIban}
                  onChangeText={setNewIban}
                  placeholder="MA00 0000 0000 0000 0000 0000"
                />
                <Input
                  label="BIC / SWIFT"
                  value={newBic}
                  onChangeText={setNewBic}
                  placeholder="Ex: CIHMAMC1"
                />
              </View>
            )}
          </View>

          {/* Info box */}
          <View style={[styles.infoBox, {
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary + '40',
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.md,
          }]}>
            <Text style={{ color: colors.primary, fontSize: fontSize.caption }}>
              💡 Le virement sera traité sous 24-48h ouvrés après validation.
            </Text>
          </View>

          {/* Confirm button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            disabled={!isValid || isPending}
            onPress={handleConfirm}
          >
            Demander le virement
          </Button>

          {/* Previous withdrawals */}
          <TouchableOpacity
            onPress={() => setHistoryOpen((v) => !v)}
            style={[styles.historyHeader, { marginTop: spacing.lg }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body }]}>
              Historique des virements
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>
              {historyOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {historyOpen && (
            <View style={[styles.card, {
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              overflow: 'hidden',
              marginTop: spacing.xs,
            }]}>
              {withdrawalsLoading ? (
                <View style={{ padding: spacing.md, alignItems: 'center' }}>
                  <LoadingSpinner size="sm" />
                </View>
              ) : !withdrawals?.length ? (
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, padding: spacing.md, textAlign: 'center' }}>
                  Aucun virement effectué.
                </Text>
              ) : (
                withdrawals.map((w, idx) => (
                  <View key={w.id}>
                    <View style={[styles.wRow, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>
                          {formatAmount(w.amount)}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                          {formatDate(w.createdAt)}
                          {w.processedAt ? ` · Traité le ${formatDate(w.processedAt)}` : ''}
                        </Text>
                      </View>
                      <Badge
                        label={STATUS_LABEL[w.status] ?? w.status}
                        variant={STATUS_VARIANT[w.status] ?? 'warning'}
                        size="sm"
                      />
                    </View>
                    {idx < (withdrawals.length - 1) && <Divider />}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:   { fontWeight: '700' },
  closeBtn:      { padding: 4 },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountInput:   { width: '100%', borderBottomWidth: 2, paddingVertical: 8, fontWeight: '700' },
  pillsRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  pill:          { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1.5 },
  sectionTitle:  { fontWeight: '700' },
  ribRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner:    { width: 9, height: 9, borderRadius: 5 },
  infoBox:       { borderWidth: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wRow:          { flexDirection: 'row', alignItems: 'center' },
});
