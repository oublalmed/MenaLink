import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Divider,
  LoadingSpinner,
  StarRating,
} from '../../components/atoms';
import { ProviderMap } from '../../components/organisms';
import { useAuthStore } from '../../store/authStore';
import { useProviderReviews } from '../../hooks/api/useReviews';
import { useProviderStats } from '../../hooks/api/useProviderMissions';

const SERVICE_OPTIONS = [
  { key: 'CLEANING',          label: 'Ménage',          icon: '🧹' },
  { key: 'IRONING',           label: 'Repassage',       icon: '👕' },
  { key: 'DEEP_CLEANING',     label: 'Grand nettoyage', icon: '🪣' },
  { key: 'POST_CONSTRUCTION', label: 'Post-chantier',   icon: '🏗️' },
  { key: 'COOKING',           label: 'Cuisine',         icon: '🍳' },
] as const;

const RADIUS_OPTIONS = ['5km', '10km', '20km', '50km'] as const;

function ReviewCard({ review, colors, spacing, fontSize, radius }: any) {
  return (
    <View style={[{
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
        <Avatar
          firstName={review.authorName.split(' ')[0]}
          lastName={review.authorName.split(' ')[1] ?? ''}
          uri={review.authorAvatarUrl}
          size="sm"
        />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.caption }}>
            {review.authorName}
          </Text>
          <StarRating value={review.rating} size="sm" readonly />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
          {new Date(review.createdAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {review.comment ? (
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }} numberOfLines={3}>
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
}

export function ProviderProfileScreen() {
  const { colors, spacing, fontSize, radius } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: stats } = useProviderStats();
  const { data: reviewsData, isLoading: reviewsLoading } = useProviderReviews(user?.id ?? '', 3);

  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [hourlyMin, setHourlyMin] = useState('80');
  const [hourlyMax, setHourlyMax] = useState('150');
  const [selectedServices, setSelectedServices] = useState<string[]>(['CLEANING']);
  const [selectedRadius, setSelectedRadius] = useState<string>('10km');

  const toggleService = (key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  };

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  function handleAvatarPress() {
    Alert.alert('Photo de profil', 'Modifier votre photo', [
      { text: 'Prendre une photo', onPress: () => Alert.alert('Fonctionnalité à venir') },
      { text: 'Choisir dans la galerie', onPress: () => Alert.alert('Fonctionnalité à venir') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  function handleDocumentUpload(docName: string) {
    Alert.alert(docName, 'Fonctionnalité à venir — vous pourrez bientôt télécharger vos documents.');
  }

  const isVerified = (user as any)?.isVerified ?? false;
  const verificationStatus = (user as any)?.verificationStatus ?? 'NONE';

  const verificationBadge = isVerified
    ? { label: '✓ Vérifiée', variant: 'success' as const }
    : verificationStatus === 'PENDING'
    ? { label: '⏳ En attente', variant: 'warning' as const }
    : { label: 'Non vérifiée', variant: 'neutral' as const };

  const cinRectoUploaded = (user as any)?.cinRectoUploaded ?? false;
  const cinVersoUploaded = (user as any)?.cinVersoUploaded ?? false;
  const portraitUploaded = (user as any)?.portraitUploaded ?? false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header avatar + name */}
        <View style={[styles.headerCard, {
          backgroundColor: colors.card,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.md,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }]}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={{ alignItems: 'center' }}>
            <Avatar
              firstName={user?.firstName ?? ''}
              lastName={user?.lastName ?? ''}
              uri={user?.avatarUrl}
              size="xl"
            />
            <View style={[styles.editAvatarBadge, {
              backgroundColor: colors.primary,
              borderRadius: radius.full,
            }]}>
              <Text style={{ color: '#fff', fontSize: 11 }}>✏️</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text, fontSize: fontSize.h2, marginTop: spacing.md }]}>
            {user?.firstName} {user?.lastName}
          </Text>

          <View style={{ marginTop: spacing.xs }}>
            <Badge label={verificationBadge.label} variant={verificationBadge.variant} />
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { marginTop: spacing.md }]}>
            <View style={styles.statItem}>
              <StarRating value={stats?.averageRating ?? 0} size="sm" readonly />
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginTop: 2 }}>
                Note
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.h3 }}>
                {stats?.monthMissions ?? 0}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                Ce mois
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.h3 }}>
                {stats?.acceptanceRate != null ? `${Math.round(stats.acceptanceRate * 100)}%` : '--'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption }}>
                Acceptation
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setEditMode((v) => !v)}
            style={[styles.editBtn, {
              backgroundColor: editMode ? colors.success : colors.primary,
              borderRadius: radius.lg,
              marginTop: spacing.md,
            }]}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.caption }}>
              {editMode ? '✓ Sauvegarder' : '✏️ Modifier le profil'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body }]}>
            À propos
          </Text>
          {editMode ? (
            <View style={{ marginTop: spacing.sm }}>
              <TextInput
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, 300))}
                placeholder="Présentez-vous en quelques mots..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                style={[styles.bioInput, {
                  color: colors.text,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  fontSize: fontSize.body,
                }]}
              />
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, textAlign: 'right', marginTop: 2 }}>
                {bio.length}/300
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.sm }}>
              {bio || 'Aucune description. Appuyez sur Modifier pour ajouter une bio.'}
            </Text>
          )}
        </View>

        {/* Tarifs */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Tarifs (MAD/h)
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: 4 }}>Min</Text>
              <TextInput
                value={hourlyMin}
                onChangeText={setHourlyMin}
                keyboardType="numeric"
                editable={editMode}
                style={[styles.rateInput, {
                  color: colors.text,
                  borderColor: editMode ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  fontSize: fontSize.body,
                }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: 4 }}>Max</Text>
              <TextInput
                value={hourlyMax}
                onChangeText={setHourlyMax}
                keyboardType="numeric"
                editable={editMode}
                style={[styles.rateInput, {
                  color: colors.text,
                  borderColor: editMode ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  fontSize: fontSize.body,
                }]}
              />
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Services proposés
          </Text>
          <View style={styles.chipsWrap}>
            {SERVICE_OPTIONS.map((svc) => (
              <Chip
                key={svc.key}
                label={svc.label}
                icon={svc.icon}
                selected={selectedServices.includes(svc.key)}
                onPress={editMode ? () => toggleService(svc.key) : undefined}
                disabled={!editMode}
              />
            ))}
          </View>
        </View>

        {/* Zone d'intervention */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Zone d'intervention
          </Text>
          <View style={{ height: 160, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm }}>
            <ProviderMap />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, marginBottom: spacing.sm }}>
            Rayon de couverture
          </Text>
          <View style={styles.chipsWrap}>
            {RADIUS_OPTIONS.map((r) => (
              <Chip
                key={r}
                label={r}
                selected={selectedRadius === r}
                onPress={editMode ? () => setSelectedRadius(r) : undefined}
                disabled={!editMode}
              />
            ))}
          </View>
        </View>

        {/* Documents */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Documents
          </Text>
          {[
            { label: 'CIN Recto',      uploaded: cinRectoUploaded },
            { label: 'CIN Verso',      uploaded: cinVersoUploaded },
            { label: 'Photo portrait', uploaded: portraitUploaded },
          ].map((doc, idx, arr) => (
            <View key={doc.label}>
              <View style={[styles.docRow, { paddingVertical: spacing.sm }]}>
                <Text style={{ color: colors.text, fontSize: fontSize.body, flex: 1 }}>{doc.label}</Text>
                {doc.uploaded ? (
                  <Badge label="✓ Téléchargé" variant="success" size="sm" />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleDocumentUpload(doc.label)}
                    style={[styles.uploadBtn, {
                      backgroundColor: colors.warning + '20',
                      borderColor: colors.warning,
                      borderRadius: radius.md,
                    }]}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: colors.warning, fontSize: fontSize.caption, fontWeight: '600' }}>
                      📤 Télécharger
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {idx < arr.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        {/* Avis reçus */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Avis reçus
          </Text>
          {reviewsLoading ? (
            <View style={{ alignItems: 'center', padding: spacing.md }}>
              <LoadingSpinner size="sm" />
            </View>
          ) : reviewsData?.items?.length ? (
            <>
              {reviewsData.items.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  colors={colors}
                  spacing={spacing}
                  fontSize={fontSize}
                  radius={radius}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => Alert.alert('Avis', 'Fonctionnalité bientôt disponible.')}
              >
                Voir tous les avis
              </Button>
            </>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.caption, textAlign: 'center', paddingVertical: spacing.sm }}>
              Aucun avis reçu pour le moment.
            </Text>
          )}
        </View>

        {/* Statistiques */}
        <View style={[styles.section, {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          margin: spacing.md,
          marginBottom: 0,
          padding: spacing.md,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize.body, marginBottom: spacing.sm }]}>
            Statistiques
          </Text>
          <View style={styles.statCards}>
            <View style={[styles.statCard, { backgroundColor: colors.primary + '12', borderRadius: radius.md }]}>
              <Text style={{ color: colors.primary, fontSize: fontSize.h3, fontWeight: '700' }}>
                {stats?.acceptanceRate != null ? `${Math.round(stats.acceptanceRate * 100)}%` : '--'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>Taux acceptation</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.warning + '12', borderRadius: radius.md }]}>
              <Text style={{ color: colors.warning, fontSize: fontSize.h3, fontWeight: '700' }}>
                {stats?.averageRating?.toFixed(1) ?? '--'}/5
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>Note moyenne</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success + '12', borderRadius: radius.md }]}>
              <Text style={{ color: colors.success, fontSize: fontSize.h3, fontWeight: '700' }}>
                {stats?.monthMissions ?? 0}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>Missions totales</Text>
            </View>
          </View>
        </View>

        {/* Déconnexion */}
        <View style={{ margin: spacing.md, marginTop: spacing.lg }}>
          <Button variant="danger" size="lg" fullWidth onPress={handleLogout}>
            Déconnexion
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  headerCard:     { alignItems: 'center' },
  editAvatarBadge:{
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName:       { fontWeight: '700' },
  statsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statItem:       { alignItems: 'center', paddingHorizontal: 16 },
  statDivider:    { width: 1, height: 32 },
  editBtn:        { paddingHorizontal: 20, paddingVertical: 9 },
  section: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle:   { fontWeight: '700', marginBottom: 4 },
  row:            { flexDirection: 'row' },
  bioInput:       { borderWidth: 1, padding: 10, minHeight: 90, textAlignVertical: 'top' },
  rateInput:      { borderWidth: 1, padding: 10 },
  chipsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docRow:         { flexDirection: 'row', alignItems: 'center' },
  uploadBtn:      { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  statCards:      { flexDirection: 'row', gap: 8 },
  statCard:       { flex: 1, alignItems: 'center', padding: 12 },
});
