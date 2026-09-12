'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types/auth';

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  setUser: (user: AdminUser | null) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

/** Глобальное состояние текущего администратора */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'admin_auth_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
