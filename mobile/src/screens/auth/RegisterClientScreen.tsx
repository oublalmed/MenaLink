import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button, Input } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterClient'>;

export function RegisterClientScreen({ navigation }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  const { register, isLoading } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    try {
      await register({ firstName, lastName, email, phone, password, role: 'CLIENT' });
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
            Créer un compte client
          </Text>

          <View style={{ gap: spacing.md }}>
            <Input label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Samira" />
            <Input label="Nom" value={lastName} onChangeText={setLastName} placeholder="El Idrissi" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="samira@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Téléphone" value={phone} onChangeText={setPhone} placeholder="+212612345678" keyboardType="phone-pad" />
            <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </View>

          {error != null && (
            <Text style={{ color: colors.danger, marginTop: spacing.md, fontSize: fontSize.caption }}>{error}</Text>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleRegister}
            leftIcon={<Text>👤</Text>}
          >
            Créer mon compte
          </Button>

          <Button variant="ghost" size="md" fullWidth onPress={() => navigation.navigate('LoginScreen')}>
            Déjà un compte ? Se connecter
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
});
