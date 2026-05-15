import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export function PaymentScreen({ route, navigation }: Props) {
  const { bookingId, amount, paymentUrl } = route.params;
  const { colors, fontSize, spacing } = useTheme();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationChange = (state: WebViewNavigation) => {
    const url = state.url;

    if (url.includes('/payments/success') || url.includes('success=true')) {
      navigation.replace('BookingDetail', { bookingId });
      return;
    }

    if (url.includes('/payments/failure') || url.includes('success=false') || url.includes('error=true')) {
      Alert.alert(
        'Paiement échoué',
        'Le paiement n\'a pas pu être traité. Veuillez réessayer.',
        [
          { text: 'Réessayer', onPress: () => webViewRef.current?.reload() },
          { text: 'Annuler', style: 'cancel', onPress: () => navigation.goBack() },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={{ fontSize: 24, color: colors.text }}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontSize.h3 }]}>
            Paiement sécurisé
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {amount.toFixed(2)} MAD
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Chargement du paiement...
            </Text>
          </View>
        )}
        onError={() => {
          Alert.alert(
            'Erreur de connexion',
            'Impossible de charger la page de paiement.',
            [{ text: 'Retour', onPress: () => navigation.goBack() }],
          );
        }}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Préparation du paiement...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  closeBtn:     { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title:        { fontWeight: '600' },
  amount:       { fontSize: 16, fontWeight: '700', marginTop: 2 },
  webview:      { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText:  { fontSize: 14 },
});
