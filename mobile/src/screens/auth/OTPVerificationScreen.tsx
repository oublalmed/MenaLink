import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/atoms';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

export function OTPVerificationScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const { colors, spacing, fontSize, radius } = useTheme();
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputs                  = useRef<TextInput[]>([]);

  function handleDigit(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (!digit && index > 0) inputs.current[index - 1]?.focus();
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) { setError('Entrez le code à 6 chiffres'); return; }
    setLoading(true);
    setError(null);
    try {
      // In real app: await verifyOTP(phone, code);
      await new Promise(r => setTimeout(r, 1000));
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch {
      setError('Code incorrect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.xl }}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h2, marginBottom: spacing.sm }]}>
          Vérification du numéro
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginBottom: spacing.xl }}>
          Un code à 6 chiffres a été envoyé au {phone}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { if (el) inputs.current[i] = el; }}
              style={[styles.otpInput, {
                backgroundColor: colors.card,
                borderColor: digit ? colors.primary : colors.border,
                borderRadius: radius.md,
                color: colors.text,
                fontSize: fontSize.h2,
              }]}
              value={digit}
              onChangeText={t => handleDigit(t, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {error != null && (
          <Text style={{ color: colors.danger, marginBottom: spacing.md, fontSize: fontSize.caption }}>{error}</Text>
        )}

        <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleVerify}>
          Vérifier
        </Button>

        <TouchableOpacity style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: fontSize.body }}>Renvoyer le code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpInput: { width: 46, height: 56, borderWidth: 1.5, fontWeight: '700' },
});
