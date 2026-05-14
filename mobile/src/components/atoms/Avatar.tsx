import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/** Size options for the avatar */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Presence / availability indicator */
type StatusBadge = 'online' | 'offline' | 'busy';

/**
 * Props for the Avatar component.
 */
export interface AvatarProps {
  /** Remote image URI; when absent, initials are shown */
  uri?: string;
  /** User first name (used for initials fallback and color derivation) */
  firstName?: string;
  /** User last name (used for initials fallback) */
  lastName?: string;
  /** Avatar size: xs=24, sm=32, md=44, lg=64, xl=96 */
  size?: AvatarSize;
  /** Optional presence badge shown in the bottom-right corner */
  statusBadge?: StatusBadge;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const BADGE_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 8,
  sm: 11,
  md: 15,
  lg: 22,
  xl: 32,
};

/** Derives a deterministic background color from the user's name */
function colorFromName(name: string): string {
  const palette = [
    '#E8963A', '#27AE60', '#E67E22', '#9B59B6',
    '#E74C3C', '#1ABC9C', '#F39C12', '#2ECC71',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

const STATUS_COLORS: Record<StatusBadge, string> = {
  online: '#27AE60',
  offline: '#7F8C8D',
  busy: '#E67E22',
};

/**
 * Circular avatar showing either a remote image or initials fallback.
 * Supports an optional status badge in the bottom-right corner.
 *
 * @example
 * <Avatar firstName="Fatima" lastName="Zahra" size="lg" statusBadge="online" />
 */
export const Avatar = React.memo<AvatarProps>(
  ({ uri, firstName = '', lastName = '', size = 'md', statusBadge }) => {
    const { radius } = useTheme();

    const dimension = SIZE_MAP[size];
    const badgeSize = BADGE_SIZE_MAP[size];
    const fontSize = FONT_SIZE_MAP[size];
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
    const bgColor = colorFromName(`${firstName}${lastName}` || 'User');

    const badgeBorderWidth = badgeSize > 10 ? 2 : 1.5;

    return (
      <View style={{ width: dimension, height: dimension }}>
        {uri != null && uri !== '' ? (
          <Image
            source={{ uri }}
            style={[
              styles.image,
              { width: dimension, height: dimension, borderRadius: radius.full },
            ]}
            accessibilityLabel={`Avatar de ${firstName} ${lastName}`}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: dimension,
                height: dimension,
                borderRadius: radius.full,
                backgroundColor: bgColor,
              },
            ]}
            accessibilityLabel={`Avatar de ${firstName} ${lastName}`}
          >
            <Text style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>
              {initials}
            </Text>
          </View>
        )}

        {statusBadge != null && (
          <View
            style={[
              styles.badge,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: radius.full,
                backgroundColor: STATUS_COLORS[statusBadge],
                borderWidth: badgeBorderWidth,
                borderColor: '#FFFFFF',
                bottom: 0,
                right: 0,
              },
            ]}
            accessibilityLabel={statusBadge}
          />
        )}
      </View>
    );
  },
);

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
  },
});
