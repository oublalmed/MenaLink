import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Props for the LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  /** Size of the spinner indicator */
  size?: 'small' | 'large';
  /** Override spinner color */
  color?: string;
  /** When true, renders a full-screen semi-transparent overlay */
  overlay?: boolean;
  /** Optional label displayed below the spinner */
  label?: string;
}

/**
 * Loading indicator with optional label and full-screen overlay mode.
 *
 * When `overlay` is true, the spinner is centered over a semi-transparent
 * backdrop and rendered inside a Modal to block interactions.
 *
 * @example
 * <LoadingSpinner size="large" label="Chargement…" />
 * <LoadingSpinner overlay label="Traitement en cours…" />
 */
export const LoadingSpinner = React.memo<LoadingSpinnerProps>(
  ({ size = 'large', color, overlay = false, label }) => {
    const { colors, spacing, radius, fontSize } = useTheme();
    const spinnerColor = color ?? colors.primary;

    const inner = (
      <View
        style={[
          styles.inner,
          overlay && [
            styles.card,
            {
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: spacing.xl,
            },
          ],
        ]}
      >
        <ActivityIndicator size={size} color={spinnerColor} />
        {label != null && label !== '' && (
          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
                fontSize: fontSize.body,
                marginTop: spacing.sm,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    );

    if (overlay) {
      return (
        <Modal
          transparent
          animationType="fade"
          visible
          statusBarTranslucent
          accessibilityViewIsModal
        >
          <View style={styles.backdrop}>{inner}</View>
        </Modal>
      );
    }

    return inner;
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '400',
    textAlign: 'center',
  },
});
