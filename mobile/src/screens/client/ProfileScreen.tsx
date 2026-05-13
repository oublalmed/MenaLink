import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Avatar, Badge, Button, Divider } from '../../components/atoms';
import { useAuthStore } from '../../store/authStore';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ADDRESSES = [
  { id: '1', label: 'Domicile', line: '14 Rue Ibn Battouta, Casablanca 20100' },
  { id: '2', label: 'Bureau',   line: '3 Avenue Mohammed V, Rabat 10000' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', date: '2025-05-10', service: 'Nettoyage complet',   amount: 350, status: 'PAID'    },
  { id: 't2', date: '2025-04-28', service: 'Ménage hebdomadaire', amount: 200, status: 'PAID'    },
  { id: 't3', date: '2025-04-15', service: 'Nettoyage vitrerie',  amount: 180, status: 'PENDING' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientProfileScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, logout } = useAuthStore();

  // Edit mode
  const [editMode, setEditMode]   = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName  ?? '');
  const [email, setEmail]         = useState(user?.email     ?? '');
  const [phone, setPhone]         = useState(user?.phone     ?? '');

  // Notification toggles
  const [notifBookings,   setNotifBookings]   = useState(true);
  const [notifMessages,   setNotifMessages]   = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);

  function handleAvatarPress() {
    Alert.alert('Photo de profil', 'Que souhaitez-vous faire ?', [
      { text: 'Changer la photo', onPress: () => Alert.alert('Bientôt disponible', 'Fonctionnalité à venir.') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  function handleSaveProfile() {
    setEditMode(false);
    Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées.');
  }

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Profile header ── */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card, paddingVertical: spacing.xl }]}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            <Avatar
              firstName={editMode ? firstName : (user?.firstName ?? '')}
              lastName={editMode ? lastName  : (user?.lastName  ?? '')}
              uri={user?.avatarUrl}
              size="xl"
            />
            <View style={[styles.cameraOverlay, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
              <Text style={{ color: '#fff', fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>

          {!editMode ? (
            <>
              <Text style={[styles.fullName, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.body }}>{user?.email}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>{user?.phone}</Text>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.primary, borderRadius: radius.full, marginTop: spacing.md }]}
                onPress={() => setEditMode(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.primary, fontSize: fontSize.caption, fontWeight: '600' }}>
                  Modifier le profil
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ width: '80%', marginTop: spacing.md }}>
              <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName} placeholder="Prénom"     placeholderTextColor={colors.textSecondary} />
              <TextInput style={inputStyle} value={lastName}  onChangeText={setLastName}  placeholder="Nom"        placeholderTextColor={colors.textSecondary} />
              <TextInput style={inputStyle} value={email}     onChangeText={setEmail}     placeholder="Email"      keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
              <TextInput style={inputStyle} value={phone}     onChangeText={setPhone}     placeholder="Téléphone"  keyboardType="phone-pad" placeholderTextColor={colors.textSecondary} />
              <View style={styles.editActions}>
                <Button variant="outline" size="sm" onPress={() => setEditMode(false)}>Annuler</Button>
                <Button variant="primary" size="sm" onPress={handleSaveProfile}>Enregistrer</Button>
              </View>
            </View>
          )}
        </View>

        {/* ── Mes adresses ── */}
        <SectionTitle title="Mes adresses" colors={colors} fontSize={fontSize} spacing={spacing} />
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md }]}>
          {MOCK_ADDRESSES.map((addr, i) => (
            <View key={addr.id}>
              <View style={[styles.row, { padding: spacing.md }]}>
                <Text style={{ fontSize: 20, marginRight: spacing.sm }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{addr.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>{addr.line}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={{ color: colors.primary, fontSize: fontSize.caption }}>Modifier</Text>
                </TouchableOpacity>
              </View>
              {i < MOCK_ADDRESSES.length - 1 && <Divider />}
            </View>
          ))}
          <Divider />
          <TouchableOpacity
            style={[styles.row, { padding: spacing.md }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Adresse', 'Fonctionnalité à venir.')}
          >
            <Text style={{ fontSize: 20, marginRight: spacing.sm }}>➕</Text>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.body }}>
              Ajouter une adresse
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Historique paiements ── */}
        <SectionTitle title="Historique paiements" colors={colors} fontSize={fontSize} spacing={spacing} />
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md }]}>
          {MOCK_TRANSACTIONS.map((tx, i) => (
            <View key={tx.id}>
              <View style={[styles.row, { padding: spacing.md, justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.body }}>{tx.service}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                    {new Date(tx.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.body }}>
                    {tx.amount} MAD
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <Badge
                      label={tx.status === 'PAID' ? 'Payé' : 'En attente'}
                      variant={tx.status === 'PAID' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>
                </View>
              </View>
              {i < MOCK_TRANSACTIONS.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        {/* ── Paramètres notifications ── */}
        <SectionTitle title="Paramètres notifications" colors={colors} fontSize={fontSize} spacing={spacing} />
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md }]}>
          <NotifToggle icon="📅" label="Réservations" value={notifBookings}   onChange={setNotifBookings}   colors={colors} fontSize={fontSize} spacing={spacing} />
          <Divider />
          <NotifToggle icon="💬" label="Messages"     value={notifMessages}   onChange={setNotifMessages}   colors={colors} fontSize={fontSize} spacing={spacing} />
          <Divider />
          <NotifToggle icon="🎁" label="Promotions"   value={notifPromotions} onChange={setNotifPromotions} colors={colors} fontSize={fontSize} spacing={spacing} />
        </View>

        {/* ── Support + Legal ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md }]}>
          <MenuRow icon="❓" label="Aide & Support"            onPress={() => Alert.alert('Support', 'Contactez-nous sur support@menalink.ma')}   colors={colors} fontSize={fontSize} spacing={spacing} />
          <Divider />
          <MenuRow icon="📄" label="Conditions d'utilisation"  onPress={() => Alert.alert("Conditions d'utilisation", 'Fonctionnalité à venir.')} colors={colors} fontSize={fontSize} spacing={spacing} />
        </View>

        {/* ── Logout ── */}
        <View style={{ paddingHorizontal: spacing.md }}>
          <Button variant="danger" size="lg" fullWidth onPress={handleLogout}>
            Se déconnecter
          </Button>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ title, colors, fontSize, spacing }: any) {
  return (
    <Text style={{
      color: colors.textSecondary,
      fontSize: fontSize.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginHorizontal: spacing.md + 4,
      marginBottom: spacing.xs,
      marginTop: spacing.lg,
    }}>
      {title}
    </Text>
  );
}

function NotifToggle({ icon, label, value, onChange, colors, fontSize, spacing }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
      <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{icon}</Text>
      <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function MenuRow({ icon, label, onPress, colors, fontSize, spacing }: any) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{icon}</Text>
      <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{label}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1 },
  profileHeader: { alignItems: 'center' },
  fullName:      { fontWeight: '700' },
  editBtn:       { borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 6 },
  editActions:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  card: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row:           { flexDirection: 'row', alignItems: 'center' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
