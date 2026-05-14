import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  getIdToken,
  User,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  off,
  set,
  push,
  update,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  get,
  DataSnapshot,
} from 'firebase/database';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth     = getAuth(app);
export const firebaseDatabase = getDatabase(app);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuthResult {
  user: User;
  idToken: string;
}

export const AuthService = {
  /** Connexion email + mot de passe. */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await getIdToken(credential.user, true);
    return { user: credential.user, idToken };
  },

  /** Inscription email + mot de passe. */
  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await getIdToken(credential.user, true);
    return { user: credential.user, idToken };
  },

  /**
   * Connexion Google.
   * @param googleIdToken Token obtenu depuis expo-google-sign-in ou @react-native-google-signin
   */
  async signInWithGoogle(googleIdToken: string): Promise<AuthResult> {
    const googleCredential = GoogleAuthProvider.credential(googleIdToken);
    const userCredential = await signInWithCredential(firebaseAuth, googleCredential);
    const idToken = await getIdToken(userCredential.user, true);
    return { user: userCredential.user, idToken };
  },

  /**
   * Connexion Apple.
   * @param appleIdToken Token obtenu depuis expo-apple-authentication
   * @param rawNonce Nonce brut utilisé pour générer le SHA256
   */
  async signInWithApple(appleIdToken: string, rawNonce: string): Promise<AuthResult> {
    const provider = new OAuthProvider('apple.com');
    const appleCredential = provider.credential({ idToken: appleIdToken, rawNonce });
    const userCredential = await signInWithCredential(firebaseAuth, appleCredential);
    const idToken = await getIdToken(userCredential.user, true);
    return { user: userCredential.user, idToken };
  },

  /** Déconnexion. */
  async signOut(): Promise<void> {
    await firebaseSignOut(firebaseAuth);
  },

  /** Rafraîchit et retourne un nouveau ID token. */
  async refreshToken(): Promise<string | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return getIdToken(user, true);
  },

  /** Écoute les changements d'état d'authentification. Retourne une fonction de cleanup. */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(firebaseAuth, callback);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME DB SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image';
  readBy: Record<string, boolean>;
  createdAt: number;
}

export interface ProviderLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: number;
}

export interface BookingStatusUpdate {
  status: string;
  updatedAt: number;
}

export const RealtimeDBService = {
  /**
   * S'abonne aux changements de statut d'une réservation.
   * Retourne une fonction de cleanup (off).
   */
  subscribeToBookingStatus(
    bookingId: string,
    callback: (update: BookingStatusUpdate) => void,
  ): () => void {
    const dbRef = ref(firebaseDatabase, `bookings/${bookingId}`);
    const listener = onValue(dbRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val() as BookingStatusUpdate | null;
      if (data) callback(data);
    });
    // Return cleanup function
    return () => off(dbRef, 'value', listener);
  },

  /**
   * S'abonne à la position GPS d'un prestataire en temps réel.
   * Retourne une fonction de cleanup.
   */
  subscribeToProviderLocation(
    providerId: string,
    callback: (location: ProviderLocation) => void,
  ): () => void {
    const dbRef = ref(firebaseDatabase, `provider_locations/${providerId}`);
    const listener = onValue(dbRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val() as ProviderLocation | null;
      if (data) callback(data);
    });
    return () => off(dbRef, 'value', listener);
  },

  /** Met à jour la position GPS du prestataire connecté. */
  async updateProviderLocation(
    providerId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
  ): Promise<void> {
    const dbRef = ref(firebaseDatabase, `provider_locations/${providerId}`);
    await set(dbRef, {
      lat, lng, heading: heading ?? null, speed: speed ?? null,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * S'abonne aux nouveaux messages d'un chat.
   * Retourne les 50 derniers messages et écoute les nouveaux.
   * Retourne une fonction de cleanup.
   */
  subscribeToChat(
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void {
    const messagesRef = query(
      ref(firebaseDatabase, `chats/${chatId}/messages`),
      orderByChild('createdAt'),
      limitToLast(50),
    );
    const listener = onValue(messagesRef, (snapshot: DataSnapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child) => {
        messages.push({ id: child.key ?? '', ...child.val() } as ChatMessage);
      });
      callback(messages);
    });
    return () => off(messagesRef, 'value', listener);
  },

  /** Envoie un message dans un chat. */
  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'text' | 'image' = 'text',
  ): Promise<string> {
    const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
    const newRef = push(messagesRef);
    const messageId = newRef.key ?? '';
    await set(newRef, {
      senderId, senderName, content, type,
      readBy: { [senderId]: true },
      createdAt: serverTimestamp(),
    });
    // Update chat metadata
    await update(ref(firebaseDatabase, `chats/${chatId}`), {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
    });
    return messageId;
  },

  /** Marque tous les messages non lus comme lus pour un utilisateur. */
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    const updates: Record<string, boolean> = {};
    snapshot.forEach((child) => {
      const msg = child.val() as ChatMessage;
      if (!msg.readBy?.[userId]) {
        updates[`chats/${chatId}/messages/${child.key}/readBy/${userId}`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(firebaseDatabase), updates);
    }
  },

  /** Obtient le nombre de messages non lus pour un chat. */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const messagesRef = ref(firebaseDatabase, `chats/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    let count = 0;
    snapshot.forEach((child) => {
      const msg = child.val() as ChatMessage;
      if (!msg.readBy?.[userId]) count++;
    });
    return count;
  },

  /** Met à jour l'indicateur de frappe. */
  async setTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(firebaseDatabase, `chats/${chatId}/typing/${userId}`);
    await set(typingRef, isTyping ? true : null);
  },

  /** S'abonne à l'indicateur de frappe d'un autre utilisateur. */
  subscribeToTyping(
    chatId: string,
    otherUserId: string,
    callback: (isTyping: boolean) => void,
  ): () => void {
    const typingRef = ref(firebaseDatabase, `chats/${chatId}/typing/${otherUserId}`);
    const listener = onValue(typingRef, (snapshot) => {
      callback(snapshot.val() === true);
    });
    return () => off(typingRef, 'value', listener);
  },
};
