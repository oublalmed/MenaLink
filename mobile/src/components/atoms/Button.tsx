import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../theme';

/** Visual style variants for the button */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

/** Size options controlling padding and font size */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Button component.
 */
export interface ButtonProps {
  /** Visual variant controlling colors */
  variant?: ButtonVariant;
  /** Size controlling padding and font size */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction when true */
  loading?: boolean;
  /** Disables the button when true */
  disabled?: boolean;
  /** Callback when button is pressed */
  onPress?: () => void;
  /** Button label text */
  children: React.ReactNode;
  /** Icon rendered to the left of the label */
  leftIcon?: React.ReactNode;
  /** Icon rendered to the right of the label */
  rightIcon?: React.ReactNode;
  /** Makes the button take full available width */
  fullWidth?: boolean;
}

/**
 * Primary interactive button component.
 *
 * Supports 5 visual variants, 3 sizes, loading state, disabled state,
 * optional left/right icons, and full-width mode.
 *
 * @example
 * <Button variant="primary" size="md" onPress={handlePress}>
 *   Réserver
 * </Button>
 */
export const Button = React.memo<ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onPress,
    children,
    leftIcon,
    rightIcon,
    fullWidth = false,
  }) => {
    const { colors, spacing, radius, fontSize } = useTheme();

    const isDisabled = disabled || loading;

    const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
      primary: { bg: colors.primary, text: colors.white, border: 'transparent' },
      secondary: { bg: colors.lightGray, text: colors.dark, border: 'transparent' },
      outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
      danger: { bg: colors.danger, text: colors.white, border: 'transparent' },
      ghost: { bg: 'transparent', text: colors.primary, border: 'transparent' },
    };

    const sizeStyles: Record<ButtonSize, { paddingV: number; paddingH: number; fs: number; rad: number }> = {
      sm: { paddingV: spacing.xs, paddingH: spacing.sm, fs: fontSize.caption, rad: radius.md },
      md: { paddingV: spacing.sm + 2, paddingH: spacing.md, fs: fontSize.body, rad: radius.md },
      lg: { paddingV: spacing.md, paddingH: spacing.lg, fs: fontSize.h3, rad: radius.lg },
    };

    const vs = variantStyles[variant];
    const ss = sizeStyles[size];

    const containerStyle: ViewStyle = {
      backgroundColor: isDisabled ? colors.gray : vs.bg,
      borderColor: isDisabled ? 'transparent' : vs.border,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderRadius: ss.rad,
      paddingVertical: ss.paddingV,
      paddingHorizontal: ss.paddingH,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: isDisabled ? 0.6 : 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
          />
        ) : (
          <>
            {leftIcon != null && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text
              style={[
                styles.label,
                { color: isDisabled ? colors.white : vs.text, fontSize: ss.fs },
              ]}
              numberOfLines={1}
            >
              {children}
            </Text>
            {rightIcon != null && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});
