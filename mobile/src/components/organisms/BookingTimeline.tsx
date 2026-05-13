import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

const STEPS: { key: BookingStatus; label: string; icon: string }[] = [
  { key: 'PENDING',     label: 'En attente',  icon: '⏳' },
  { key: 'CONFIRMED',   label: 'Confirmée',   icon: '✅' },
  { key: 'IN_PROGRESS', label: 'En cours',    icon: '🔄' },
  { key: 'COMPLETED',   label: 'Terminée',    icon: '🏁' },
];

const CANCELLED_STEPS: { key: BookingStatus; label: string; icon: string }[] = [
  { key: 'PENDING',   label: 'En attente',  icon: '⏳' },
  { key: 'CANCELLED', label: 'Annulée',     icon: '❌' },
];

export interface BookingTimelineProps {
  currentStatus: BookingStatus;
  timestamps?: Partial<Record<BookingStatus, string>>;
}

export function BookingTimeline({ currentStatus, timestamps }: BookingTimelineProps) {
  const { colors, spacing, fontSize, radius } = useTheme();

  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'DISPUTED';
  const steps       = isCancelled ? CANCELLED_STEPS : STEPS;

  const currentIndex = steps.findIndex(s => s.key === currentStatus);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isPast    = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture  = index > currentIndex;

        const dotColor = isCancelled && isCurrent
          ? colors.danger
          : isPast || isCurrent ? colors.primary : colors.lightGray;

        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.leftCol}>
              <View style={[styles.dot, { backgroundColor: dotColor, borderRadius: radius.full, borderColor: dotColor, borderWidth: isCurrent ? 3 : 0, width: isCurrent ? 20 : 14, height: isCurrent ? 20 : 14 }]}>
                {isCurrent && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white }} />}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.line, { backgroundColor: isPast ? colors.primary : colors.border }]} />
              )}
            </View>
            <View style={[styles.content, { paddingBottom: spacing.lg }]}>
              <View style={styles.row}>
                <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{step.icon}</Text>
                <View>
                  <Text style={{ color: isFuture ? colors.textSecondary : colors.text, fontWeight: isCurrent ? '700' : '500', fontSize: fontSize.body }}>
                    {step.label}
                  </Text>
                  {timestamps?.[step.key] != null && (
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                      {new Date(timestamps[step.key]!).toLocaleString('fr-MA')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  step: { flexDirection: 'row' },
  leftCol: { alignItems: 'center', width: 32 },
  dot: { alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 4, minHeight: 16 },
  content: { flex: 1, paddingLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
