import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { Avatar, Button, Chip, EmptyState, LoadingSpinner, StarRating } from '../../components/atoms';
import { ReviewCard } from '../../components/molecules';
import { useProvider, useProviderReviews } from '../../hooks/api';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderDetail'>;

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const BANNER_HEIGHT = 200;
const AVATAR_SIZE = 80;
const AVATAR_OFFSET = AVATAR_SIZE / 2;

const SERVICE_LABELS: Record<string, string> = {
  CLEANING: '🧹 Ménage',
  IRONING: '👔 Repassage',
  DEEP_CLEANING: '✨ Grand nettoyage',
  POST_CONSTRUCTION: '🏗️ Post-construction',
  COOKING: '🍳 Cuisine',
};

export default function ProviderDetailScreen({ route, navigation }: Props) {
  const { providerId } = route.params;
  const { colors, spacing, radius, fontSize } = useTheme();

  const { data: provider, isLoading: providerLoading } = useProvider(providerId);
  const { data: reviewsData, isLoading: reviewsLoading } = useProviderReviews(providerId, 3);

  const [bioExpanded, setBioExpanded] = useState(false);

  const reviewsRef = useRef<ScrollView>(null);

  const { data: availabilityData } = useQuery({
    queryKey: ['provider-availability', providerId],
    queryFn: () =>
      apiClient
        .get<{ data: { date: string; isAvailable: boolean }[] }>(`/providers/${providerId}/availability`)
        .then(r => r.data.data ?? []),
    enabled: !!providerId,
    staleTime: 60_000,
  });

  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun

  if (providerLoading || !provider) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  const fullName = `${provider.firstName} ${provider.lastName}`;
  const reviews = reviewsData?.items ?? [];
  const totalReviews = reviewsData?.total ?? provider.totalReviews;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Banner ── */}
      <View style={[styles.banner, { backgroundColor: colors.primary, height: BANNER_HEIGHT }]}>
        {/* Back button */}
        <SafeAreaView edges={['top']} style={styles.backWrapper}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Decorative circle */}
        <View style={[styles.bannerCircle, { borderColor: 'rgba(255,255,255,0.15)' }]} />
      </View>

      {/* ── Avatar centred on banner edge ── */}
      <View style={[styles.avatarContainer, { marginTop: BANNER_HEIGHT - AVATAR_OFFSET }]}>
        <View style={[styles.avatarRing, { borderColor: colors.white, backgroundColor: colors.white }]}>
          <Avatar
            uri={provider.avatarUrl}
            firstName={provider.firstName}
            lastName={provider.lastName}
            size="xl"
            statusBadge={provider.isOnline ? 'online' : 'offline'}
          />
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        ref={reviewsRef}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.md, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name row */}
        <View style={[styles.nameRow, { marginTop: spacing.sm }]}>
          <Text style={[styles.name, { color: colors.text, fontSize: fontSize.h2 }]}>{fullName}</Text>
          {provider.isOnline && (
            <View style={[styles.onlineDot, { backgroundColor: colors.success, marginLeft: spacing.xs }]} />
          )}
          {provider.isVerified && (
            <View style={[styles.verifiedChip, { backgroundColor: colors.success + '20', marginLeft: spacing.xs }]}>
              <Text style={[styles.verifiedText, { color: colors.success }]}>✓ Vérifié</Text>
            </View>
          )}
        </View>

        {/* Rating + stats */}
        <View style={[styles.statsRow, { marginTop: spacing.xs }]}>
          <StarRating value={provider.averageRating} readonly showLabel size={16} />
          <Text style={[styles.statsText, { color: colors.textSecondary, fontSize: fontSize.caption, marginLeft: spacing.xs }]}>
            ({totalReviews} avis)
          </Text>
          <View style={[styles.statDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.statsText, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
            {provider.totalMissions} missions
          </Text>
        </View>

        {/* Bio */}
        {provider.bio ? (
          <View style={{ marginTop: spacing.md }}>
            <Text
              style={[styles.bio, { color: colors.text, fontSize: fontSize.body }]}
              numberOfLines={bioExpanded ? undefined : 3}
            >
              {provider.bio}
            </Text>
            <TouchableOpacity onPress={() => setBioExpanded(v => !v)}>
              <Text style={[styles.seeMore, { color: colors.primary, fontSize: fontSize.caption }]}>
                {bioExpanded ? 'Voir moins' : 'Voir plus'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Services & Tarifs */}
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.h3, marginTop: spacing.lg }]}>
          Services &amp; Tarifs
        </Text>
        <View style={styles.chipsWrap}>
          {provider.services.map(s => (
            <Chip
              key={s.serviceType}
              label={`${SERVICE_LABELS[s.serviceType] ?? s.serviceType}  •  ${s.pricePerHour} MAD/h`}
              variant="outline"
            />
          ))}
        </View>

        {/* Disponibilités */}
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.h3, marginTop: spacing.lg }]}>
          Disponibilités
        </Text>
        <View style={styles.daysRow}>
          {DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            // Build the date string for this day (relative to today)
            const dayDate = new Date();
            dayDate.setHours(0, 0, 0, 0);
            // todayIndex is 0=Mon, so offset from JS day (0=Sun)
            const jsDayOffset = (i - todayIndex + 7) % 7;
            dayDate.setDate(dayDate.getDate() + jsDayOffset);
            const dateStr = dayDate.toISOString().split('T')[0];
            const avail = availabilityData?.find(a => a.date === dateStr);
            const isUnavailable = avail !== undefined && !avail.isAvailable;
            return (
              <TouchableOpacity
                key={day}
                activeOpacity={0.7}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: isToday ? colors.primary : colors.card,
                    borderColor: isToday ? colors.primary : colors.border,
                    borderRadius: radius.md,
                    opacity: isUnavailable ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.dayText, { color: isToday ? colors.white : colors.textSecondary, fontSize: fontSize.caption }]}>
                  {day}
                </Text>
                {isUnavailable && (
                  <Text style={{ fontSize: 9, color: isToday ? colors.white : colors.textSecondary, marginTop: 2 }}>✗</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Avis clients */}
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.h3, marginTop: spacing.lg }]}>
          Avis clients
        </Text>

        {reviewsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="Aucun avis pour l'instant"
            subtitle="Soyez le premier à laisser un avis !"
          />
        ) : (
          <>
            {reviews.map(r => (
              <ReviewCard
                key={r.id}
                authorName={r.authorName}
                authorAvatarUrl={r.authorAvatarUrl}
                rating={r.rating}
                comment={r.comment}
                createdAt={r.createdAt}
                serviceType={r.serviceType}
              />
            ))}
            {totalReviews > 3 && (
              <Button variant="outline" size="sm" onPress={() => reviewsRef.current?.scrollToEnd({ animated: true })}>
                Voir tous les {totalReviews} avis
              </Button>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Fixed CTA bar ── */}
      <View
        style={[
          styles.ctaBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 28 : spacing.md,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
          },
        ]}
      >
        <View style={styles.ctaLeft}>
          <Text style={[styles.ctaPrice, { color: colors.text, fontSize: fontSize.h3 }]}>
            {provider.hourlyRateMin} – {provider.hourlyRateMax}{' '}
            <Text style={[styles.ctaPriceUnit, { color: colors.textSecondary }]}>MAD/h</Text>
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onPress={() =>
              navigation.navigate('Booking', {
                providerId: provider.id,
                providerName: fullName,
                hourlyRateMin: provider.hourlyRateMin,
              })
            }
          >
            Réserver maintenant
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { position: 'relative', overflow: 'hidden' },
  bannerCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 40,
    right: -80,
    top: -80,
  },
  backWrapper: { position: 'absolute', top: 0, left: 0, zIndex: 10 },
  backBtn: {
    margin: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backArrow: { fontSize: 18, fontWeight: '700', color: '#1B3A2D' },
  avatarContainer: { alignItems: 'center', zIndex: 5 },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 9999,
    padding: 2,
  },
  scrollContent: { paddingTop: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  name: { fontWeight: '700' },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  verifiedChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  statsText: { fontWeight: '400' },
  statDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 6 },
  bio: { lineHeight: 22, fontWeight: '400' },
  seeMore: { marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayPill: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  dayText: { fontWeight: '500' },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  ctaLeft: { justifyContent: 'center' },
  ctaPrice: { fontWeight: '700' },
  ctaPriceUnit: { fontWeight: '400' },
});
