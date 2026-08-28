'use client';

import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface UIState {
  /** Sidebar свёрнут (десктоп) */
  sidebarCollapsed: boolean;
  /** Sidebar открыт на мобильных */
  mobileSidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: getInitialTheme(),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      return { theme: next };
    }),
}));
