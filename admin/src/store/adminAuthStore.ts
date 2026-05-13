import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';

interface AdminAuthState {
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;

  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  firebaseUser: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      set({ firebaseUser: user, isAuthenticated: !!user, isInitialized: true });
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await signOut(firebaseAuth);
    set({ firebaseUser: null, isAuthenticated: false });
  },
}));
