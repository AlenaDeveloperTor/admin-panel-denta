'use client';

import { create } from 'zustand';
import type { AdminUser } from '@/types/auth';

interface AuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  clear: () => void;
}

/** Глобальное состояние текущего администратора (ТЗ §10.1) */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
