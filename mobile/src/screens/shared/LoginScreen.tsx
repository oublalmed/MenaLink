import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import type { AuthStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<AuthStackParamList>;

export default function LoginScreen(): React.JSX.Element {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigation = useNavigation<NavProp>();

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner votre e-mail et mot de passe.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Connexion échouée', err instanceof Error ? err.message : 'Identifiants incorrects.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🕌</Text>
          <Text style={styles.brand}>MenaLink</Text>
          <Text style={styles.tagline}>LAÂYOUNE • SAHARA</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(v => !v)}
              accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Se connecter"
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social auth (placeholder — requires native Google/Apple SDK config) */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Alert.alert('Bientôt disponible', 'La connexion Google sera disponible dans la prochaine version.')}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>🟢</Text>
            <Text style={styles.socialBtnText}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RegisterClient')}>
              <Text style={[styles.registerText, { color: COLORS.primary, fontWeight: '600' }]}>
                S'inscrire
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('RegisterProvider')}>
            <Text style={[styles.registerText, { textAlign: 'center', marginTop: 4, color: COLORS.dark }]}>
              Je suis prestataire →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.background },
  container:    { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header:       { alignItems: 'center', marginBottom: 32 },
  emoji:        { fontSize: 52, marginBottom: 8 },
  brand:        { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  tagline:      { fontSize: 11, letterSpacing: 2, color: COLORS.dark, fontWeight: '600', marginTop: 2, opacity: 0.6 },
  subtitle:     { fontSize: 15, color: COLORS.gray, marginTop: 8 },
  form:         { width: '100%' },
  label:        { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6, marginTop: 12 },
  input:        { backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.dark, marginBottom: 4, borderWidth: 1, borderColor: '#E5D9C8' },
  passwordRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:       { padding: 12, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: '#E5D9C8' },
  forgotRow:    { alignItems: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText:   { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  btn:          { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnDisabled:  { opacity: 0.7 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#E5D9C8' },
  dividerText:  { color: COLORS.gray, fontSize: 13 },
  socialBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5D9C8', borderRadius: 12, paddingVertical: 14, backgroundColor: COLORS.white },
  socialBtnText:{ fontSize: 15, fontWeight: '500', color: COLORS.dark },
  registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { fontSize: 14, color: COLORS.gray },
});
