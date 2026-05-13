import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Badge, Button, Divider } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';

const MENU_ITEMS = [
  { icon: '🧹', label: 'Mes services' },
  { icon: '📍', label: 'Zone de couverture' },
  { icon: '💳', label: 'Informations bancaires' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🔒', label: 'Sécurité' },
  { icon: '❓', label: 'Aide & Support' },
];

export function ProviderProfileScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: colors.card, padding: spacing.xl }]}>
          <View style={styles.avatarWrap}>
            <Avatar size={80} uri={user?.avatarUrl} name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
            {user?.status === 'ACTIVE' && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success, borderRadius: radius.full }]}>
                <Text style={{ fontSize: 12 }}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[styles.name, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>{user?.email}</Text>
          <View style={{ marginTop: spacing.sm }}>
            <Badge
              label={user?.status === 'ACTIVE' ? 'Vérifié' : 'En attente de vérification'}
              variant={user?.status === 'ACTIVE' ? 'success' : 'warning'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, margin: spacing.md, borderRadius: radius.lg }]}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.label}>
              <TouchableOpacity style={[styles.menuRow, { padding: spacing.md }]} activeOpacity={0.7}>
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
                <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{item.label}</Text>
                <Text style={{ color: colors.textSecondary }}>›</Text>
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        <View style={{ padding: spacing.md }}>
          <Button variant="danger" size="lg" fullWidth onPress={handleLogout}>
            Se déconnecter
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  section: { overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
});
