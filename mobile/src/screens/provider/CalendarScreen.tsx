import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { EmptyState } from '../../components/atoms';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const today   = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.getDate());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.md }]}>
          Calendrier
        </Text>

        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }]}>
          <View style={styles.row}>
            <TouchableOpacity onPress={prevMonth}><Text style={{ color: colors.primary, fontSize: 22 }}>‹</Text></TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', color: colors.text, fontWeight: '700', fontSize: fontSize.h3 }}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth}><Text style={{ color: colors.primary, fontSize: 22 }}>›</Text></TouchableOpacity>
          </View>

          <View style={[styles.grid, { marginTop: spacing.sm }]}>
            {DAYS.map(d => (
              <Text key={d} style={[styles.dayLabel, { color: colors.textSecondary, fontSize: fontSize.caption }]}>{d}</Text>
            ))}
            {cells.map((day, i) => {
              const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSel     = day === selected;
              return (
                <TouchableOpacity
                  key={i}
                  disabled={!day}
                  onPress={() => day && setSelected(day)}
                  style={[
                    styles.dayCell,
                    isSel && { backgroundColor: colors.primary, borderRadius: radius.full },
                    isToday && !isSel && { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.full },
                  ]}
                >
                  <Text style={{ color: isSel ? colors.white : day ? colors.text : 'transparent', fontSize: fontSize.body }}>
                    {day ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.h3, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          Missions du {selected} {MONTHS[month]}
        </Text>
      </View>

      <EmptyState
        icon={<Text style={{ fontSize: 40 }}>📅</Text>}
        title="Aucune mission ce jour"
        description="Vous n'avez pas de mission planifiée."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  calendarCard: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', paddingVertical: 4, fontWeight: '600' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
});
