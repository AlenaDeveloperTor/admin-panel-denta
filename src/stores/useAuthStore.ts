'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser } from '@/types/auth';

import { setLoggerUser } from '@/lib/logger';

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
      setUser: (user) => {
        if (user) {
          setLoggerUser({
            id: user.id,
            username: user.name,
            email: user.email,
          });
        } else {
          setLoggerUser(null);
        }
        set({ user });
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => {
        setLoggerUser(null);
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'admin_auth_store',
      storage: createJSONStorage(() => localStorage),
      // Токен не персистим — он живёт только в памяти.
      // Хранение Bearer JWT в localStorage создаёт XSS-уязвимость.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
