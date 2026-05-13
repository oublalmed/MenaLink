import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button, Input } from '../../components/atoms';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, spacing, fontSize } = useTheme();
  const [phone, setPhone]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSend() {
    if (!phone.match(/^\+212[5-7]\d{8}$/)) {
      setError('Numéro invalide. Format: +212XXXXXXXXX');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // await api.post('/auth/forgot-password', { phone });
      await new Promise(r => setTimeout(r, 1000));
      setSent(true);
      navigation.navigate('OTPVerification', { phone, mode: 'forgot' });
    } catch {
      setError('Impossible d\'envoyer le code. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.xl }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.sm }]}>
          Mot de passe oublié
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginBottom: spacing.xl }}>
          Entrez votre numéro de téléphone pour recevoir un code de réinitialisation.
        </Text>

        <Input
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+212612345678"
          keyboardType="phone-pad"
        />

        {error != null && (
          <Text style={{ color: colors.danger, marginTop: spacing.sm, fontSize: fontSize.caption }}>{error}</Text>
        )}

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleSend}>
            Envoyer le code
          </Button>
          <Button variant="ghost" size="md" fullWidth onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
});
