import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import { api } from '../services/api';
import { User, RegisterDto } from '../../../shared/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      set({ firebaseUser, isInitialized: true });
      if (firebaseUser) {
        await get().fetchProfile();
      } else {
        set({ user: null });
      }
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (dto) => {
    set({ isLoading: true });
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        firebaseAuth,
        dto.email,
        dto.password,
      );

      const response = await api.post<User>('/auth/register', {
        ...dto,
        firebaseUid: firebaseUser.uid,
      });

      set({ user: response.data });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await signOut(firebaseAuth);
    set({ user: null, firebaseUser: null });
  },

  fetchProfile: async () => {
    try {
      const response = await api.get<User>('/auth/me');
      set({ user: response.data });
    } catch {
      set({ user: null });
    }
  },
}));
