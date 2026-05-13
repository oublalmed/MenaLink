import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = React.memo<EmptyStateProps>(({ icon, title, description, action }) => {
  const { colors, spacing, fontSize } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      {icon != null && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h3, marginTop: icon ? spacing.md : 0 }]}>
        {title}
      </Text>
      {description != null && (
        <Text style={[styles.desc, { color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.sm }]}>
          {description}
        </Text>
      )}
      {action != null && <View style={{ marginTop: spacing.lg }}>{action}</View>}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginBottom: 4 },
  title: { fontWeight: '600', textAlign: 'center' },
  desc: { textAlign: 'center', lineHeight: 20 },
});
