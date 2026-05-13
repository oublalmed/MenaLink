import React, { useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Button, Divider } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';

const MOCK_ADDRESSES = [
  { id: '1', label: 'Domicile', street: '12 Rue Anfa', city: 'Casablanca', isDefault: true },
  { id: '2', label: 'Bureau', street: '45 Bd Zerktouni', city: 'Casablanca', isDefault: false },
];

const MOCK_PAYMENTS = [
  { id: '1', date: '12/03/2024', service: 'Grand ménage', amount: 350, status: 'PAID' },
  { id: '2', date: '28/02/2024', service: 'Ménage', amount: 160, status: 'PAID' },
  { id: '3', date: '15/02/2024', service: 'Repassage', amount: 120, status: 'REFUNDED' },
];

const STATUS_COLOR: Record<string, string> = { PAID: '#27AE60', PENDING: '#E67E22', REFUNDED: '#2980B9', FAILED: '#E74C3C' };
const STATUS_LABEL: Record<string, string> = { PAID: 'Payé', PENDING: 'En attente', REFUNDED: 'Remboursé', FAILED: 'Échoué' };

export function ClientProfileScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, logout } = useAuthStore();

  const [isEditing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPromos, setNotifPromos]     = useState(false);

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  function handleChangePhoto() {
    Alert.alert('Changer la photo', 'Sélectionnez une option', [
      { text: 'Prendre une photo', onPress: () => {} },
      { text: 'Choisir dans la galerie', onPress: () => {} },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const SectionTitle = ({ children }: { children: string }) => (
    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {children}
    </Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, paddingVertical: spacing.xl }]}>
          <TouchableOpacity onPress={handleChangePhoto} accessibilityLabel="Changer la photo de profil">
            <View style={{ position: 'relative' }}>
              <Avatar size={80} uri={user?.avatarUrl} name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
              <View style={[styles.cameraBtn, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
                <Text style={{ fontSize: 12 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>{user?.email}</Text>
        </View>

        <View style={{ padding: spacing.md }}>
          {/* Personal Info */}
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <SectionTitle>Informations personnelles</SectionTitle>
              <TouchableOpacity onPress={() => setEditing(e => !e)} accessibilityLabel={isEditing ? 'Annuler' : 'Modifier'}>
                <Text style={{ color: colors.primary, fontSize: fontSize.body }}>{isEditing ? 'Annuler' : 'Modifier'}</Text>
              </TouchableOpacity>
            </View>
            {isEditing ? (
              <View style={{ padding: spacing.md, gap: spacing.sm }}>
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Prénom</Text>
                  <TextInput style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]} value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nom</Text>
                  <TextInput style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]} value={lastName} onChangeText={setLastName} />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Téléphone</Text>
                  <TextInput style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <Button variant="primary" size="md" fullWidth onPress={() => setEditing(false)}>Enregistrer</Button>
              </View>
            ) : (
              <View style={{ padding: spacing.md }}>
                {[{ label: 'Prénom', value: user?.firstName }, { label: 'Nom', value: user?.lastName }, { label: 'Email', value: user?.email }, { label: 'Téléphone', value: user?.phone }]
                  .map(({ label, value }, i, arr) => (
                    <View key={label}>
                      <View style={[styles.fieldRow, { paddingVertical: spacing.sm }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
                        <Text style={{ color: colors.text, fontSize: fontSize.body }}>{value ?? '—'}</Text>
                      </View>
                      {i < arr.length - 1 && <Divider />}
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Addresses */}
          <SectionTitle>Mes adresses</SectionTitle>
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            {MOCK_ADDRESSES.map((addr, i) => (
              <View key={addr.id}>
                <View style={[styles.addrRow, { padding: spacing.md }]}>
                  <Text style={{ fontSize: 20, marginRight: spacing.sm }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{addr.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{addr.street}, {addr.city}</Text>
                  </View>
                  {addr.isDefault && <Text style={{ color: colors.primary, fontSize: fontSize.caption }}>Par défaut</Text>}
                </View>
                {i < MOCK_ADDRESSES.length - 1 && <Divider />}
              </View>
            ))}
            <Divider />
            <TouchableOpacity style={[styles.addrRow, { padding: spacing.md }]} accessibilityLabel="Ajouter une adresse">
              <Text style={{ fontSize: 20, marginRight: spacing.sm }}>➕</Text>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.body }}>Ajouter une adresse</Text>
            </TouchableOpacity>
          </View>

          {/* Payment history */}
          <SectionTitle>Historique paiements</SectionTitle>
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            {MOCK_PAYMENTS.map((tx, i) => (
              <View key={tx.id}>
                <View style={[styles.txRow, { padding: spacing.md }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: fontSize.body, fontWeight: '500' }}>{tx.service}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>{tx.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{tx.amount} MAD</Text>
                    <Text style={{ color: STATUS_COLOR[tx.status], fontSize: fontSize.caption }}>{STATUS_LABEL[tx.status]}</Text>
                  </View>
                </View>
                {i < MOCK_PAYMENTS.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          {/* Notifications */}
          <SectionTitle>Notifications</SectionTitle>
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            {[
              { label: 'Réservations', value: notifBookings, setter: setNotifBookings },
              { label: 'Messages', value: notifMessages, setter: setNotifMessages },
              { label: 'Promotions', value: notifPromos, setter: setNotifPromos },
            ].map(({ label, value, setter }, i, arr) => (
              <View key={label}>
                <View style={[styles.toggleRow, { padding: spacing.md }]}>
                  <Text style={{ color: colors.text, fontSize: fontSize.body }}>{label}</Text>
                  <Switch
                    value={value}
                    onValueChange={setter}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.white}
                    accessibilityLabel={`Notifications ${label}`}
                  />
                </View>
                {i < arr.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          {/* Other links */}
          <SectionTitle>Aide</SectionTitle>
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            {['❓  Aide & Support', '📄  Conditions d\'utilisation', '🔒  Politique de confidentialité'].map((item, i, arr) => (
              <View key={item}>
                <TouchableOpacity style={[styles.menuRow, { padding: spacing.md }]} accessibilityLabel={item.replace(/^.+  /, '')}>
                  <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{item}</Text>
                  <Text style={{ color: colors.textSecondary }}>›</Text>
                </TouchableOpacity>
                {i < arr.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
            <Button variant="danger" size="lg" fullWidth onPress={handleLogout}>
              Se déconnecter
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  section: { overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 13, width: 90 },
  fieldInput: { flex: 1, borderWidth: 1, padding: 8, fontSize: 14 },
  addrRow: { flexDirection: 'row', alignItems: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
});
