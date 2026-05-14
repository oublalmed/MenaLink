import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/atoms';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: '💰', label: 'Prix clairs' },
  { icon: '🔒', label: 'Paiement sécurisé' },
  { icon: '📍', label: 'Suivi temps réel' },
  { icon: '✅', label: 'Prestataires vérifiés' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Decorative desert/mosque illustration using text + shapes */}
        <View style={[styles.illustrationWrapper, { backgroundColor: '#F0E8D5', borderRadius: 80 }]}>
          <Text style={styles.illustrationEmoji}>🕌</Text>
          <View style={[styles.sunDecor, { backgroundColor: colors.primary, opacity: 0.15 }]} />
        </View>

        <Text style={[styles.tagline, { color: colors.dark, fontSize: 13, letterSpacing: 2 }]}>
          LAÂYOUNE • SAHARA
        </Text>

        <Text style={[styles.title, { color: colors.dark, fontSize: 28 }]}>
          Bienvenue à{'\n'}
          <Text style={{ color: colors.primary }}>Laâyoune</Text> 🌿
        </Text>

        <Text style={[styles.subtitle, { color: '#7A6A55', fontSize: fontSize.body }]}>
          Votre service de ménage{'\n'}fiable et local.
        </Text>
      </Animated.View>

      {/* Features strip */}
      <View style={[styles.features, { backgroundColor: '#F0E8D5', paddingVertical: spacing.md }]}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureItem}>
            <Text style={{ fontSize: 22 }}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: '#7A6A55', fontSize: 10 }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <Animated.View
        style={[styles.actions, { paddingHorizontal: spacing.xl, opacity: fadeAnim }]}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('LoginScreen')}
        >
          Se connecter
        </Button>
        <View style={{ height: spacing.sm }} />
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('RegisterClient')}
        >
          Créer un compte
        </Button>
        <View style={{ height: spacing.xs }} />
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => navigation.navigate('RegisterProvider')}
        >
          Je suis prestataire →
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, justifyContent: 'space-between' },
  hero:               { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 32 },
  illustrationWrapper:{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  illustrationEmoji:  { fontSize: 72 },
  sunDecor:           { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  tagline:            { marginBottom: 8, fontWeight: '600' },
  title:              { fontWeight: '700', textAlign: 'center', lineHeight: 38, marginBottom: 12 },
  subtitle:           { textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  features:           { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 0 },
  featureItem:        { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  featureLabel:       { textAlign: 'center', fontWeight: '500', marginTop: 2 },
  actions:            { paddingBottom: 32, paddingTop: 16 },
});
