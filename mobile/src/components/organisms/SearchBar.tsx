import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  filterCount?: number;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  placeholder = 'Rechercher un prestataire...',
  filterCount = 0,
  autoFocus = false,
}: SearchBarProps) {
  const { colors, spacing, fontSize, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const inputRef              = useRef<TextInput>(null);

  function handleClear() {
    onChangeText('');
    inputRef.current?.focus();
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.primary : colors.border,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <Text style={{ fontSize: 18, marginRight: spacing.sm, color: focused ? colors.primary : colors.gray }}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={{ flex: 1, color: colors.text, fontSize: fontSize.body, paddingVertical: 10 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => onSubmit?.(value)}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
            <Text style={{ color: colors.gray, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {onFilterPress != null && (
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.primary, borderRadius: radius.lg, marginLeft: spacing.sm }]}
          onPress={onFilterPress}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
          {filterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  filterBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
