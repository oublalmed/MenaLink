import * as admin from 'firebase-admin';

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
