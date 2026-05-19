import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, StatusBar, Animated,
} from 'react-native';

const COLORS = {
  primary: '#E8963A',
  dark: '#1B3A2D',
  background: '#FBF4EC',
  lightGray: '#F0E8D5',
  gray: '#7A6A55',
  white: '#FFFFFF',
  danger: '#E74C3C',
};

const FEATURES = [
  { icon: '💰', label: 'Prix clairs' },
  { icon: '🔒', label: 'Paiement sécurisé' },
  { icon: '📍', label: 'Suivi temps réel' },
  { icon: '✅', label: 'Prestataires vérifiés' },
];

const SERVICES = [
  { icon: '🧹', label: 'Ménage', price: 'Dès 60 MAD/h' },
  { icon: '🧽', label: 'Nettoyage profond', price: 'Dès 90 MAD/h' },
  { icon: '👔', label: 'Repassage', price: 'Dès 50 MAD/h' },
  { icon: '🍳', label: 'Cuisine', price: 'Dès 70 MAD/h' },
  { icon: '🏗️', label: 'Post-construction', price: 'Dès 100 MAD/h' },
];

type Screen = 'welcome' | 'login' | 'register' | 'home';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.hero}>
          <View style={styles.illustrationWrapper}>
            <Text style={{ fontSize: 72 }}>🕌</Text>
          </View>
          <Text style={styles.tagline}>LAÂYOUNE • SAHARA</Text>
          <Text style={styles.title}>
            Bienvenue à{'\n'}
            <Text style={{ color: COLORS.primary }}>MenaLink</Text> 🌿
          </Text>
          <Text style={styles.subtitle}>
            Votre service de ménage{'\n'}fiable et local.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen('login')}>
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setScreen('register')}>
            <Text style={styles.outlineBtnText}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.ghostBtnText}>Explorer sans compte →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'login') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.formContainer}>
          <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.backBtn}>
            <Text style={{ fontSize: 18, color: COLORS.dark }}>← Retour</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 72, textAlign: 'center' }}>🕌</Text>
          <Text style={[styles.title, { fontSize: 24, marginBottom: 4 }]}>MenaLink</Text>
          <Text style={[styles.tagline, { marginBottom: 32 }]}>LAÂYOUNE • SAHARA</Text>
          <Text style={[styles.subtitle, { marginBottom: 24 }]}>Connectez-vous à votre compte</Text>

          <Text style={styles.inputLabel}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="samira@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => setScreen('home')}>
            <Text style={styles.primaryBtnText}>Connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 16 }}>
            <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: '500' }}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: COLORS.gray }}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => setScreen('register')}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'register') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.formContainer}>
          <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.backBtn}>
            <Text style={{ fontSize: 18, color: COLORS.dark }}>← Retour</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 48, textAlign: 'center' }}>👤</Text>
          <Text style={[styles.title, { fontSize: 22, marginBottom: 24 }]}>Créer un compte</Text>

          <Text style={styles.inputLabel}>Prénom</Text>
          <TextInput style={styles.input} placeholder="Samira" />

          <Text style={styles.inputLabel}>Nom</Text>
          <TextInput style={styles.input} placeholder="El Idrissi" />

          <Text style={styles.inputLabel}>Adresse e-mail</Text>
          <TextInput style={styles.input} placeholder="samira@gmail.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.inputLabel}>Téléphone</Text>
          <TextInput style={styles.input} placeholder="+212 6XX XXX XXX" keyboardType="phone-pad" />

          <Text style={styles.inputLabel}>Mot de passe</Text>
          <TextInput style={styles.input} placeholder="Min. 8 caractères" secureTextEntry />

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => setScreen('home')}>
            <Text style={styles.primaryBtnText}>Créer mon compte</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: COLORS.gray }}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Home screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        {/* Header */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>📍 Laâyoune, Sahara</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.dark, marginTop: 4 }}>
              Bonjour, Samira 👋
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <Text style={{ color: COLORS.gray, marginLeft: 8, flex: 1 }}>Rechercher un service...</Text>
        </View>

        {/* Services */}
        <Text style={styles.sectionTitle}>Nos services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 24 }}>
          {SERVICES.map((s) => (
            <View key={s.label} style={styles.serviceCard}>
              <Text style={{ fontSize: 36 }}>{s.icon}</Text>
              <Text style={{ fontWeight: '600', color: COLORS.dark, marginTop: 8, fontSize: 14 }}>{s.label}</Text>
              <Text style={{ color: COLORS.primary, fontSize: 12, marginTop: 4, fontWeight: '500' }}>{s.price}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Top providers */}
        <Text style={styles.sectionTitle}>Prestataires populaires</Text>
        {[
          { name: 'Khadija M.', rating: 5.0, reviews: 24, service: 'Ménage', city: 'Casablanca' },
          { name: 'Hassan B.', rating: 4.8, reviews: 18, service: 'Nettoyage profond', city: 'Casablanca' },
          { name: 'Zineb C.', rating: 4.9, reviews: 31, service: 'Ménage & Repassage', city: 'Hay Hassani' },
          { name: 'Omar A.', rating: 4.7, reviews: 12, service: 'Nettoyage bureaux', city: 'Rabat' },
        ].map((p) => (
          <View key={p.name} style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: COLORS.dark, fontSize: 15 }}>{p.name}</Text>
              <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 2 }}>{p.service} • {p.city}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: '#F39C12', fontSize: 13 }}>⭐ {p.rating}</Text>
                <Text style={{ color: COLORS.gray, fontSize: 12, marginLeft: 6 }}>({p.reviews} avis)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bookBtn}>
              <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 12 }}>Réserver</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Bottom nav hint */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={{ fontSize: 22 }}>🏠</Text>
          <Text style={[styles.tabLabel, { color: COLORS.primary }]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={{ fontSize: 22 }}>🔍</Text>
          <Text style={styles.tabLabel}>Recherche</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={{ fontSize: 22 }}>📋</Text>
          <Text style={styles.tabLabel}>Réservations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={{ fontSize: 22 }}>💬</Text>
          <Text style={styles.tabLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setScreen('welcome')}>
          <Text style={{ fontSize: 22 }}>👤</Text>
          <Text style={styles.tabLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 32 },
  illustrationWrapper: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray, borderRadius: 80, marginBottom: 24 },
  tagline: { fontSize: 13, fontWeight: '600', color: COLORS.dark, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.dark, textAlign: 'center', lineHeight: 38, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  features: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.lightGray, paddingVertical: 16, marginHorizontal: 0 },
  featureItem: { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  featureLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  actions: { paddingHorizontal: 32, paddingBottom: 32, paddingTop: 16 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  outlineBtn: { borderWidth: 2, borderColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  outlineBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  ghostBtnText: { color: COLORS.primary, fontWeight: '500', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  formContainer: { padding: 24, paddingTop: 16 },
  backBtn: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#DDE1E7', borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.dark },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 20, padding: 14, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#DDE1E7' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, paddingHorizontal: 20, marginBottom: 12 },
  serviceCard: { width: 130, backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0E8D5' },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F0E8D5' },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F0E8D5', paddingVertical: 8, paddingBottom: 12 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '500' },
});
