import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import apiClient from '../services/api';

const INACTIVITY_MS = 8 * 60 * 60 * 1000; // 8 hours

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

function clearInactivityTimer(): void {
  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function resetInactivityTimer(logoutFn: () => Promise<void>): void {
  clearInactivityTimer();
  inactivityTimer = setTimeout(() => {
    void logoutFn();
  }, INACTIVITY_MS);
}

interface AdminAuthState {
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  otpSent: boolean;

  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  setupInactivityLogout: () => void;
}

export const useAdminAuth = create<AdminAuthState>((set, get) => ({
  firebaseUser: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  otpSent: false,

  initialize: () => {
    // DEV MODE: bypass Firebase auth to allow dashboard access
    if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
      set({ firebaseUser: null, isAuthenticated: true, isInitialized: true });
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      set({ firebaseUser: user, isAuthenticated: !!user, isInitialized: true });
      if (user) {
        get().setupInactivityLogout();
      } else {
        clearInactivityTimer();
      }
    });
    return unsubscribe;
  },

  setupInactivityLogout: () => {
    const { logout } = get();

    const handler = (): void => resetInactivityTimer(logout);

    // Remove any previously attached listeners before adding new ones
    window.removeEventListener('mousemove', handler);
    window.removeEventListener('keydown', handler);
    window.addEventListener('mousemove', handler);
    window.addEventListener('keydown', handler);

    // Start the timer immediately
    resetInactivityTimer(logout);
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // onAuthStateChanged will set isAuthenticated and call setupInactivityLogout
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    clearInactivityTimer();
    window.removeEventListener('mousemove', () => undefined);
    window.removeEventListener('keydown', () => undefined);
    await signOut(firebaseAuth);
    set({ firebaseUser: null, isAuthenticated: false, otpSent: false });
  },

  sendOtp: async (email: string) => {
    await apiClient.post('/admin/auth/send-otp', { email });
    set({ otpSent: true });
  },
}));
