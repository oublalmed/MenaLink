import * as admin from 'firebase-admin';
import { createLogger } from '../utils/logger';

const log = createLogger('firebase');

/**
 * Initialise Firebase Admin SDK (singleton).
 */
export function initFirebaseAdmin(): void {
  if (admin.apps.length > 0) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.info('Firebase Admin initialisé');
}

export const firebaseAdmin = admin;
export const firebaseAuth = (): admin.auth.Auth => admin.auth();
export const firebaseDB = (): admin.database.Database => admin.database();
export const firebaseMessaging = (): admin.messaging.Messaging => admin.messaging();

/** Vérifie un Firebase ID token et retourne les claims décodés. */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await admin.auth().verifyIdToken(idToken, true); // checkRevoked=true
  } catch (err) {
    log.warn('Token Firebase invalide', { error: (err as Error).message });
    throw err;
  }
}

/** Envoie une notification push à un seul token FCM. Returns messageId or null on failure. */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string | null> {
  if (!fcmToken) return null;
  try {
    const messageId = await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high', notification: { sound: 'default', channelId: 'menalink' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    log.debug('Push envoyé', { fcmToken: fcmToken.slice(-6), messageId });
    return messageId;
  } catch (err) {
    log.warn('Erreur push (non bloquant)', { error: (err as Error).message, fcmToken: fcmToken.slice(-6) });
    return null;
  }
}

/** Envoie une notification push à plusieurs tokens FCM (utilise sendEachForMulticast). */
export async function sendPushToMultiple(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ successCount: number; failureCount: number }> {
  const tokens = fcmTokens.filter(Boolean);
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    log.info('Multicast push envoyé', {
      total: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return { successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    log.error('Erreur multicast push', { error: (err as Error).message });
    return { successCount: 0, failureCount: tokens.length };
  }
}

/** Envoie une notification push à tous les abonnés d'un topic Firebase. */
export async function sendTopicNotification(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string | null> {
  try {
    const messageId = await admin.messaging().send({
      topic,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    log.info('Topic push envoyé', { topic, messageId });
    return messageId;
  } catch (err) {
    log.error('Erreur topic push', { topic, error: (err as Error).message });
    return null;
  }
}
