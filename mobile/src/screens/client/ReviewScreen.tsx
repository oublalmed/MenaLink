import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Avatar, Button } from '../../components/atoms';
import { useCreateReview } from '../../hooks/api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const RATING_LABELS = ['Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'];

const CONFETTI_COLORS = [
  '#E8963A', '#27AE60', '#E67E22', '#E74C3C',
  '#9B59B6', '#F1C40F', '#1ABC9C', '#E91E63',
];

function useConfettiAnimation(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(-20),
      translateX: new Animated.Value(0),
    })),
  ).current;

  const play = useCallback(() => {
    anims.forEach((a, i) => {
      a.opacity.setValue(1);
      a.translateY.setValue(-20);
      a.translateX.setValue(Math.random() * 300 - 150);
      Animated.parallel([
        Animated.timing(a.translateY, {
          toValue: 600,
          duration: 1600 + Math.random() * 600,
          delay: i * 80,
          useNativeDriver: true,
        }),
        Animated.timing(a.opacity, {
          toValue: 0,
          duration: 1800,
          delay: i * 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [anims]);

  return { anims, play };
}

export function ReviewScreen({ route, navigation }: Props) {
  const { bookingId, providerName, providerAvatarUrl } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const { mutateAsync: createReview, isPending } = useCreateReview();

  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const starScales = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  ).current;

  const { anims: confettiAnims, play: playConfetti } = useConfettiAnimation(10);

  const handleStarPress = useCallback((index: number) => {
    setRating(index + 1);
    Animated.spring(starScales[index], {
      toValue: 1.3,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(starScales[index], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    });
  }, [starScales]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    await createReview({ bookingId, rating, comment: comment.trim() || undefined });
    setSubmitted(true);
    playConfetti();
    setTimeout(() => navigation.goBack(), 2000);
  }, [rating, comment, bookingId, createReview, navigation, playConfetti]);

  const providerFirstName = providerName.split(' ')[0] ?? '';
  const providerLastName  = providerName.split(' ')[1] ?? '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize.h3 }]}>
          Laisser un avis
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, alignItems: 'center' }}>
        {/* Provider avatar + name */}
        <Avatar
          firstName={providerFirstName}
          lastName={providerLastName}
          uri={providerAvatarUrl}
          size="xl"
        />
        <Text style={[styles.providerName, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
          {providerName}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.xs, textAlign: 'center' }}>
          Comment s&apos;est passée votre mission ?
        </Text>

        {/* Animated star selector */}
        <View style={[styles.starsRow, { marginTop: spacing.xl }]}>
          {Array.from({ length: 5 }, (_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleStarPress(i)}
              activeOpacity={0.7}
              style={{ marginHorizontal: spacing.xs }}
            >
              <Animated.Text
                style={{
                  fontSize: 48,
                  transform: [{ scale: starScales[i] }],
                  color: i < rating ? colors.warning : colors.lightGray,
                }}
              >
                ★
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating label */}
        <Text style={[styles.ratingLabel, { color: colors.warning, fontSize: fontSize.h3, marginTop: spacing.sm }]}>
          {rating > 0 ? RATING_LABELS[rating - 1] : ''}
        </Text>

        {/* Comment field */}
        <View style={{ width: '100%', marginTop: spacing.lg }}>
          <TextInput
            style={[styles.commentInput, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              color: colors.text,
              fontSize: fontSize.body,
              padding: spacing.md,
            }]}
            placeholder="Décrivez votre expérience (optionnel)"
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCounter, { color: colors.textSecondary, fontSize: fontSize.caption }]}>
            {comment.length}/500
          </Text>
        </View>

        {/* Submit */}
        <View style={{ width: '100%', marginTop: spacing.xl }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            disabled={rating === 0 || submitted}
            onPress={handleSubmit}
          >
            {submitted ? 'Avis publié ✓' : 'Publier mon avis'}
          </Button>
        </View>
      </ScrollView>

      {/* Confetti layer */}
      {submitted && (
        <View style={styles.confettiLayer} pointerEvents="none">
          {confettiAnims.map((a, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  left: `${10 + (i * 8) % 80}%`,
                  opacity: a.opacity,
                  transform: [
                    { translateY: a.translateY },
                    { translateX: a.translateX },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn:      { padding: 4 },
  headerTitle:   { fontWeight: '700' },
  providerName:  { fontWeight: '700', textAlign: 'center' },
  starsRow:      { flexDirection: 'row', alignItems: 'center' },
  ratingLabel:   { fontWeight: '700', textAlign: 'center', minHeight: 24 },
  commentInput:  { height: 120, borderWidth: 1 },
  charCounter:   { textAlign: 'right', marginTop: 4 },
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  confettiPiece: { position: 'absolute', top: 80, width: 10, height: 10, borderRadius: 2 },
});
