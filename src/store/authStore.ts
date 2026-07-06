'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole } from '@/types/auth.types';

interface AuthState {
  user:            User | null;
  csrfToken:       string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;

  setUser:         (user: User | null) => void;
  setCsrfToken:    (token: string | null) => void;
  setLoading:      (loading: boolean) => void;
  logout:          () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      csrfToken:       null,
      isLoading:       false,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),

      setCsrfToken: (csrfToken) =>
        set({ csrfToken }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      logout: () =>
        set({ user: null, csrfToken: null, isAuthenticated: false }),
    }),
    {
      name:    'milap-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist user identity — never tokens (they live in httpOnly cookies)
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
