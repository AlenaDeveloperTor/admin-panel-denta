'use client';

import { create } from 'zustand';
import type { AppointmentFilters } from '@/types/appointment';

interface AppointmentFilterState {
  filters: AppointmentFilters;
  setFilters: (patch: Partial<AppointmentFilters>) => void;
  resetFilters: () => void;
}

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

const initial: AppointmentFilters = {
  date_from: startOfMonth,
  date_to: endOfMonth,
  status: '',
  page: 1,
  limit: 200,
};

/** Фильтры записей — сохраняются между страницами (ТЗ §10.1) */
export const useAppointmentFilters = create<AppointmentFilterState>((set) => ({
  filters: initial,
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch, page: patch.page ?? 1 } })),
  resetFilters: () => set({ filters: initial }),
}));
