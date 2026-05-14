import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { Avatar, Button, Chip, LoadingSpinner } from '../../components/atoms';
import { useProvider, useQuote, useCreateBooking } from '../../hooks/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

interface ClientAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SERVICE_OPTIONS = [
  { key: 'CLEANING', label: '🧹 Ménage' },
  { key: 'IRONING', label: '👔 Repassage' },
  { key: 'DEEP_CLEANING', label: '✨ Grand nettoyage' },
  { key: 'POST_CONSTRUCTION', label: '🏗️ Post-construction' },
  { key: 'COOKING', label: '🍳 Cuisine' },
] as const;

const DURATION_PRESETS = [1, 2, 3, 4];

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

const PAYMENT_METHODS = [
  { key: 'ONLINE' as const, label: '💳 En ligne (YouCan Pay)' },
  { key: 'CASH' as const, label: '💵 En espèces' },
];

const FR_DAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const FR_MONTHS = [
  'jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.',
];

function formatDate(d: Date): string {
  return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function buildWeekDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ step, colors }: { step: number; colors: any }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3, 4].map(s => (
        <View
          key={s}
          style={[
            styles.progressSegment,
            { backgroundColor: s <= step ? colors.primary : colors.lightGray },
          ]}
        />
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function BookingScreen({ route, navigation }: Props) {
  const { providerId, providerName, hourlyRateMin } = route.params;
  const { colors, spacing, radius, fontSize } = useTheme();

  const { data: provider } = useProvider(providerId);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  // ── Step state ──
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ── Step 1 ──
  const [selectedService, setSelectedService] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<string>('');

  // ── Step 2 ──
  const weekDays = useMemo(() => buildWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(weekDays[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // ── Step 3 ──
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [notes, setNotes] = useState('');

  // ── Step 4 ──
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>('CASH');

  // ── Real client addresses ──
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['client-addresses'],
    queryFn: () => apiClient.get<{ data: ClientAddress[] }>('/users/me/addresses').then(r => r.data.data ?? []),
    staleTime: 60_000,
  });
  const addresses: ClientAddress[] = addressesData ?? [];

  // Save new address mutation
  const saveAddressMutation = useMutation({
    mutationFn: (body: { street: string; city: string; label: string }) =>
      apiClient.post<{ data: ClientAddress }>('/users/me/addresses', body).then(r => r.data.data),
    onSuccess: (saved) => {
      setSelectedAddressId(saved.id);
      setAddingAddress(false);
      setNewStreet('');
      setNewCity('');
    },
  });

  // ── Quote ──
  const { data: quote, isLoading: quoteLoading } = useQuote(
    providerId,
    selectedService,
    durationHours,
  );

  // ── Helpers ──
  const handleBack = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const canAdvance = () => {
    if (step === 1) return !!selectedService && durationHours >= 1;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return addingAddress ? (newStreet.trim().length > 0 && newCity.trim().length > 0) : !!selectedAddressId;
    return true;
  };

  const handleConfirm = async () => {
    try {
      let finalAddressId = selectedAddressId;
      if (addingAddress) {
        const saved = await saveAddressMutation.mutateAsync({
          street: newStreet.trim(),
          city: newCity.trim(),
          label: `${newStreet.trim()}, ${newCity.trim()}`,
        });
        finalAddressId = saved.id;
      }

      const booking = await createBooking({
        providerId,
        serviceType: selectedService,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        durationHours,
        addressId: finalAddressId ?? undefined,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      navigation.replace('BookingDetail', { bookingId: booking.id });
    } catch {
      // Toast is shown by the mutation's onError
    }
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isSlotPast = (slot: string) => {
    if (!isToday(selectedDate)) return false;
    const now = new Date();
    const [hStr, mStr] = slot.split(':');
    return Number(hStr) * 60 + Number(mStr) <= now.getHours() * 60 + now.getMinutes();
  };

  // ── Computed summary values ──
  const baseAmount = quote ? quote.pricePerHour * durationHours : hourlyRateMin * durationHours;
  const commission = quote ? quote.commission : Math.round(baseAmount * 0.15);
  const total = quote ? quote.totalAmount : baseAmount + commission;

  const selectedAddressLabel = addingAddress
    ? `${newStreet}, ${newCity}`
    : addresses.find(a => a.id === selectedAddressId)?.label ?? '';

  const serviceName = SERVICE_OPTIONS.find(s => s.key === selectedService)?.label ?? selectedService;

  // ── Render steps ──

  const renderStep1 = () => (
    <View>
      {/* Mini provider card */}
      <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Avatar
          uri={provider?.avatarUrl}
          firstName={provider?.firstName ?? providerName.split(' ')[0]}
          lastName={provider?.lastName}
          size="md"
        />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={[styles.providerName, { color: colors.text, fontSize: fontSize.body }]}>{providerName}</Text>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.caption }]}>
            À partir de {hourlyRateMin} MAD/h
          </Text>
        </View>
      </View>

      {/* Service type */}
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg }]}>
        Type de service
      </Text>
      <View style={styles.servicesGrid}>
        {SERVICE_OPTIONS.map(opt => {
          const active = selectedService === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.8}
              style={[
                styles.serviceChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => setSelectedService(opt.key)}
            >
              <Text style={[styles.serviceChipText, { color: active ? colors.white : colors.text, fontSize: fontSize.caption }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Duration */}
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg }]}>
        Durée (heures)
      </Text>
      <View style={styles.durationRow}>
        {DURATION_PRESETS.map(h => {
          const active = durationHours === h && !customDuration;
          return (
            <TouchableOpacity
              key={h}
              activeOpacity={0.8}
              style={[
                styles.durationPill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => { setDurationHours(h); setCustomDuration(''); }}
            >
              <Text style={[{ color: active ? colors.white : colors.text, fontSize: fontSize.caption, fontWeight: '600' }]}>
                {h}h
              </Text>
            </TouchableOpacity>
          );
        })}
        <TextInput
          style={[
            styles.customInput,
            {
              borderColor: customDuration ? colors.primary : colors.border,
              color: colors.text,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              fontSize: fontSize.caption,
            },
          ]}
          placeholder="Autre"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={customDuration}
          onChangeText={v => {
            setCustomDuration(v);
            const n = parseFloat(v);
            if (!isNaN(n) && n >= 1) setDurationHours(n);
          }}
          maxLength={3}
        />
      </View>

      {/* Quote */}
      <View style={[styles.quoteBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40', borderRadius: radius.md, marginTop: spacing.md }]}>
        {quoteLoading ? (
          <LoadingSpinner size="small" />
        ) : quote ? (
          <Text style={[{ color: colors.primary, fontWeight: '700', fontSize: fontSize.body }]}>
            Devis estimé : {quote.totalAmount} MAD
          </Text>
        ) : (
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.caption }]}>
            Sélectionnez un service et une durée pour voir le devis
          </Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body }]}>Choisissez une date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
        {weekDays.map((d, i) => {
          const active = d.toDateString() === selectedDate.toDateString();
          const today = isToday(d);
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              style={[
                styles.dayCard,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : (today ? colors.primary + '60' : colors.border),
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => { setSelectedDate(d); setSelectedTime(''); }}
            >
              <Text style={[styles.dayCardWeekday, { color: active ? colors.white : colors.textSecondary, fontSize: 10 }]}>
                {FR_DAYS[d.getDay()].toUpperCase()}
              </Text>
              <Text style={[styles.dayCardNum, { color: active ? colors.white : colors.text, fontSize: fontSize.h3 }]}>
                {d.getDate()}
              </Text>
              {today && !active && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg }]}>
        Heure de début
      </Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map(slot => {
          const past = isSlotPast(slot);
          const active = selectedTime === slot;
          return (
            <TouchableOpacity
              key={slot}
              activeOpacity={past ? 1 : 0.8}
              disabled={past}
              style={[
                styles.slotPill,
                {
                  backgroundColor: active ? colors.primary : (past ? colors.lightGray : colors.card),
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.sm,
                  opacity: past ? 0.4 : 1,
                },
              ]}
              onPress={() => !past && setSelectedTime(slot)}
            >
              <Text style={[{ color: active ? colors.white : (past ? colors.textSecondary : colors.text), fontSize: 12, fontWeight: '500' }]}>
                {slot}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body }]}>Adresse d'intervention</Text>

      {addressesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : addresses.length === 0 && !addingAddress ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Aucune adresse enregistrée</Text>
        </View>
      ) : (
        addresses.map(addr => {
          const selected = !addingAddress && selectedAddressId === addr.id;
          return (
            <TouchableOpacity
              key={addr.id}
              activeOpacity={0.8}
              style={[
                styles.addressRow,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => { setSelectedAddressId(addr.id); setAddingAddress(false); }}
            >
              <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[{ color: colors.text, fontSize: fontSize.body, flex: 1 }]}>{addr.label}</Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Add new address */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.addressRow,
          {
            borderColor: addingAddress ? colors.primary : colors.border,
            backgroundColor: colors.card,
            borderRadius: radius.md,
          },
        ]}
        onPress={() => { setAddingAddress(true); setSelectedAddressId(null); }}
      >
        <View style={[styles.radioOuter, { borderColor: addingAddress ? colors.primary : colors.border }]}>
          {addingAddress && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[{ color: colors.primary, fontSize: fontSize.body, fontWeight: '600' }]}>➕ Nouvelle adresse</Text>
      </TouchableOpacity>

      {addingAddress && (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <TextInput
            style={[styles.textField, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, borderRadius: radius.md, fontSize: fontSize.body }]}
            placeholder="Rue / Quartier"
            placeholderTextColor={colors.textSecondary}
            value={newStreet}
            onChangeText={setNewStreet}
          />
          <TextInput
            style={[styles.textField, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, borderRadius: radius.md, fontSize: fontSize.body }]}
            placeholder="Ville"
            placeholderTextColor={colors.textSecondary}
            value={newCity}
            onChangeText={setNewCity}
          />
        </View>
      )}

      {/* Notes */}
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg }]}>
        Notes pour le prestataire <Text style={{ color: colors.textSecondary }}>(optionnel)</Text>
      </Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[
            styles.textArea,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card, borderRadius: radius.md, fontSize: fontSize.body },
          ]}
          placeholder="Précisez vos besoins, accès, etc."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={v => v.length <= 500 && setNotes(v)}
          textAlignVertical="top"
        />
        <Text style={[styles.charCounter, { color: colors.textSecondary, fontSize: 11 }]}>{notes.length}/500</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
      {/* Summary card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.summaryTitle, { color: colors.text, fontSize: fontSize.h3 }]}>Récapitulatif</Text>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        {[
          { label: 'Prestataire', value: providerName },
          { label: 'Service', value: serviceName },
          { label: 'Date', value: formatDate(selectedDate) },
          { label: 'Heure', value: selectedTime },
          { label: 'Durée', value: `${durationHours}h` },
          { label: 'Adresse', value: selectedAddressLabel },
        ].map(row => (
          <View key={row.label} style={styles.summaryRow}>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.caption, flex: 1 }]}>{row.label}</Text>
            <Text style={[{ color: colors.text, fontSize: fontSize.caption, fontWeight: '500', flex: 2, textAlign: 'right' }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Price breakdown */}
      <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.md }]}>
        <Text style={[styles.summaryTitle, { color: colors.text, fontSize: fontSize.h3 }]}>Détail du prix</Text>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.caption }]}>
            Base ({durationHours}h × {quote?.pricePerHour ?? hourlyRateMin} MAD/h)
          </Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.caption }]}>{baseAmount} MAD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[{ color: colors.textSecondary, fontSize: fontSize.caption }]}>Commission service (15%)</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.caption }]}>{commission} MAD</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[{ color: colors.text, fontSize: fontSize.body, fontWeight: '700' }]}>Total</Text>
          <Text style={[{ color: colors.primary, fontSize: fontSize.body, fontWeight: '700' }]}>{total} MAD</Text>
        </View>
      </View>

      {/* Payment method */}
      <Text style={[styles.label, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg }]}>
        Mode de paiement
      </Text>
      {PAYMENT_METHODS.map(pm => {
        const active = paymentMethod === pm.key;
        return (
          <TouchableOpacity
            key={pm.key}
            activeOpacity={0.8}
            style={[
              styles.addressRow,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: colors.card,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setPaymentMethod(pm.key)}
          >
            <View style={[styles.radioOuter, { borderColor: active ? colors.primary : colors.border }]}>
              {active && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[{ color: colors.text, fontSize: fontSize.body }]}>{pm.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: spacing.md }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize.h3 }]}>Réservation</Text>
          <Text style={[styles.headerStep, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
            Étape {step}/4
          </Text>
        </View>

        {/* Progress bar */}
        <ProgressBar step={step} colors={colors} />

        {/* Content */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.md, paddingBottom: spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        {/* Bottom bar */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingBottom: spacing.md }]}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canAdvance() || isPending}
            onPress={step === 4 ? handleConfirm : handleNext}
            loading={isPending}
          >
            {step === 4 ? 'Confirmer la réservation' : 'Suivant'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 36, justifyContent: 'center' },
  backArrow: { fontSize: 22, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700' },
  headerStep: { width: 60, textAlign: 'right' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 8 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  scrollContent: { paddingTop: 12 },
  label: { fontWeight: '600', marginBottom: 8 },
  // Provider card
  providerCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
  providerName: { fontWeight: '700' },
  // Services grid
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  serviceChipText: { fontWeight: '500' },
  // Duration
  durationRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  durationPill: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  customInput: { width: 60, height: 38, borderWidth: 1, textAlign: 'center', paddingHorizontal: 8 },
  // Quote box
  quoteBox: { padding: 14, borderWidth: 1, alignItems: 'center' },
  // Day card (step 2)
  dayCard: { width: 52, alignItems: 'center', paddingVertical: 10, borderWidth: 1, position: 'relative' },
  dayCardWeekday: { fontWeight: '600', marginBottom: 4 },
  dayCardNum: { fontWeight: '700' },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  // Slots
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: { width: '30%', paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  // Address
  addressRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 8, gap: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  textField: { height: 44, borderWidth: 1, paddingHorizontal: 12 },
  textArea: { height: 100, borderWidth: 1, padding: 12 },
  charCounter: { textAlign: 'right', marginTop: 4 },
  // Summary
  summaryCard: { padding: 16, borderWidth: 1 },
  summaryTitle: { fontWeight: '700', marginBottom: 8 },
  summaryDivider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  priceCard: { padding: 16, borderWidth: 1 },
  // Bottom
  bottomBar: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
