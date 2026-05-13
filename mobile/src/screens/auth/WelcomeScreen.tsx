import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/atoms';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { colors, spacing, fontSize } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { paddingHorizontal: spacing.xl }]}>
        <Text style={{ fontSize: 72, textAlign: 'center', marginBottom: spacing.md }}>🏠</Text>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h1 }]}>MenaLink</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.sm }]}>
          Trouvez des prestataires de ménage de confiance près de chez vous
        </Text>
      </View>

      <View style={[styles.actions, { paddingHorizontal: spacing.xl, gap: spacing.sm }]}>
        <Button variant="primary" size="lg" fullWidth onPress={() => navigation.navigate('LoginScreen')}>
          Se connecter
        </Button>
        <Button variant="outline" size="lg" fullWidth onPress={() => navigation.navigate('RegisterClient')}>
          Créer un compte client
        </Button>
        <Button variant="ghost" size="md" fullWidth onPress={() => navigation.navigate('RegisterProvider')}>
          Je suis prestataire
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: 48 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  actions: { paddingBottom: 24 },
});
