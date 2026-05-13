import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button, Chip, Input } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterProvider'>;

const SERVICES = [
  { value: 'CLEANING', label: 'Ménage', emoji: '🧹' },
  { value: 'IRONING', label: 'Repassage', emoji: '🧺' },
  { value: 'DEEP_CLEANING', label: 'Grand ménage', emoji: '🧼' },
  { value: 'POST_CONSTRUCTION', label: 'Post-chantier', emoji: '🏗️' },
  { value: 'COOKING', label: 'Cuisine', emoji: '👨‍🍳' },
];

export function RegisterProviderScreen({ navigation }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  const { register, isLoading } = useAuthStore();

  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [selectedServices, setSelected] = useState<string[]>([]);
  const [error, setError]               = useState<string | null>(null);

  function toggleService(value: string) {
    setSelected(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
  }

  async function handleRegister() {
    setError(null);
    if (selectedServices.length === 0) { setError('Sélectionnez au moins un service'); return; }
    try {
      await register({ firstName, lastName, email, phone, password, role: 'PROVIDER', services: selectedServices });
      navigation.navigate('OTPVerification', { phone, mode: 'register' });
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.lg }]}>
            Devenir prestataire
          </Text>

          <View style={{ gap: spacing.md }}>
            <Input label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Khadija" />
            <Input label="Nom" value={lastName} onChangeText={setLastName} placeholder="Moussaoui" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="khadija@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Téléphone" value={phone} onChangeText={setPhone} placeholder="+212612345678" keyboardType="phone-pad" />
            <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text, fontSize: fontSize.body, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            Services proposés
          </Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(s => (
              <Chip
                key={s.value}
                label={`${s.emoji} ${s.label}`}
                selected={selectedServices.includes(s.value)}
                onPress={() => toggleService(s.value)}
              />
            ))}
          </View>

          {error != null && (
            <Text style={{ color: colors.danger, marginTop: spacing.md, fontSize: fontSize.caption }}>{error}</Text>
          )}

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleRegister}>
              Créer mon profil
            </Button>
            <Button variant="ghost" size="md" fullWidth onPress={() => navigation.navigate('LoginScreen')}>
              Déjà un compte ? Se connecter
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  sectionLabel: { fontWeight: '600' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
