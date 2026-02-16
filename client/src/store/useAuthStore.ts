import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken } = response.data;
        set({ user, token: accessToken, isLoading: false });
      },

      register: async (email: string, password: string, displayName: string) => {
        const response = await api.post('/auth/register', {
          email,
          password,
          displayName,
        });
        const { user, accessToken } = response.data;
        set({ user, token: accessToken, isLoading: false });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'neuron-meet-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);

// Initialize auth check
useAuthStore.getState().checkAuth();
