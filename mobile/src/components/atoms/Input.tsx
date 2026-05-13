import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';

/** Input field type controlling keyboard and secure entry */
type InputType = 'text' | 'email' | 'phone' | 'password';

/**
 * Props for the Input component.
 */
export interface InputProps {
  /** Optional label displayed above the field */
  label?: string;
  /** Placeholder text shown when empty */
  placeholder?: string;
  /** Controlled value */
  value: string;
  /** Callback on text change */
  onChangeText: (text: string) => void;
  /** Input type controlling keyboard and visibility toggle */
  type?: InputType;
  /** Error message displayed below the field in red */
  error?: string;
  /** Node rendered on the left inside the field */
  prefixIcon?: React.ReactNode;
  /** Node rendered on the right inside the field */
  suffixIcon?: React.ReactNode;
  /** Disables the input when true */
  disabled?: boolean;
  /** Enables multiline mode */
  multiline?: boolean;
  /** Number of visible lines when multiline */
  numberOfLines?: number;
}

/**
 * Controlled text input with label, error state, focus highlight,
 * prefix/suffix icons, and password visibility toggle.
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={emailError}
 * />
 */
export const Input = React.memo<InputProps>(
  ({
    label,
    placeholder,
    value,
    onChangeText,
    type = 'text',
    error,
    prefixIcon,
    suffixIcon,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
  }) => {
    const { colors, spacing, radius, fontSize } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPassword = type === 'password';
    const secureTextEntry = isPassword && !passwordVisible;

    const keyboardTypeMap: Record<InputType, 'default' | 'email-address' | 'phone-pad'> = {
      text: 'default',
      email: 'email-address',
      phone: 'phone-pad',
      password: 'default',
    };

    const borderColor = error
      ? colors.danger
      : isFocused
      ? colors.primary
      : colors.border;

    return (
      <View style={styles.wrapper}>
        {label != null && label !== '' && (
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.xs },
            ]}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            styles.container,
            {
              borderColor,
              borderRadius: radius.md,
              backgroundColor: disabled ? colors.lightGray : colors.card,
              paddingHorizontal: spacing.sm,
              minHeight: multiline ? numberOfLines * 24 + spacing.md * 2 : 48,
            },
          ]}
        >
          {prefixIcon != null && <View style={styles.prefix}>{prefixIcon}</View>}

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: fontSize.body,
                flex: 1,
                paddingVertical: spacing.sm,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardTypeMap[type]}
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            autoCorrect={type === 'text'}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel={label}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setPasswordVisible((v) => !v)}
              style={styles.suffix}
              accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Text style={{ fontSize: 18 }}>{passwordVisible ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          )}

          {!isPassword && suffixIcon != null && (
            <View style={styles.suffix}>{suffixIcon}</View>
          )}
        </View>

        {error != null && error !== '' && (
          <Text
            style={[
              styles.error,
              { color: colors.danger, fontSize: fontSize.caption, marginTop: spacing.xs },
            ]}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  prefix: {
    marginRight: 6,
  },
  suffix: {
    marginLeft: 6,
    padding: 4,
  },
  error: {
    fontWeight: '400',
  },
});
