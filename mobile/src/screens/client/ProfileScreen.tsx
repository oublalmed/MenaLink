import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Button, Divider } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';

const MENU_ITEMS = [
  { icon: '📍', label: 'Mes adresses' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🔒', label: 'Sécurité' },
  { icon: '🌐', label: 'Langue' },
  { icon: '❓', label: 'Aide & Support' },
  { icon: '📄', label: 'Conditions d\'utilisation' },
];

export function ClientProfileScreen() {
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
          <Avatar size={80} uri={user?.avatarUrl} name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
          <Text style={[styles.name, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>{user?.email}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>{user?.phone}</Text>
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
  name: { fontWeight: '700' },
  section: { overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
});
