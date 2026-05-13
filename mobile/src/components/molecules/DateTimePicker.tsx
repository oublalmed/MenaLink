import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';

export interface DateTimePickerProps {
  date: Date | null;
  time: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  minDate?: Date;
  label?: string;
}

const DAY_ABBREV = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTH_ABBREV = ['jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];

function formatDisplayDate(date: Date): string {
  const dayName = DAY_ABBREV[date.getDay()];
  const day = date.getDate();
  const month = MONTH_FR[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}. ${day} ${month} ${year}`;
}

export const DateTimePicker = React.memo<DateTimePickerProps>(
  ({ date, time, onDateChange, onTimeChange, minDate, label }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const handleDatePress = () => {
      const selected = date ?? (minDate ?? new Date());
      onDateChange(selected);
    };

    const handleTimePress = () => {
      if (time != null) {
        onTimeChange(time);
      }
    };

    return (
      <View>
        {label != null && label !== '' && (
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm },
            ]}
          >
            {label}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
              marginBottom: spacing.sm,
            },
          ]}
          onPress={handleDatePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Choisir une date"
        >
          <Text style={styles.icon}>📅</Text>
          <Text
            style={[
              styles.rowText,
              {
                color: date != null ? colors.text : colors.textSecondary,
                fontSize: fontSize.body,
                marginLeft: spacing.sm,
              },
            ]}
          >
            {date != null ? formatDisplayDate(date) : 'Choisir une date'}
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
            },
          ]}
          onPress={handleTimePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Choisir une heure"
        >
          <Text style={styles.icon}>🕐</Text>
          <Text
            style={[
              styles.rowText,
              {
                color: time != null ? colors.text : colors.textSecondary,
                fontSize: fontSize.body,
                marginLeft: spacing.sm,
              },
            ]}
          >
            {time != null ? time : 'Choisir une heure'}
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

DateTimePicker.displayName = 'DateTimePicker';

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});
