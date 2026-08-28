'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffMember } from '@/types/staff';

/** Основной администратор (директор). Создаётся автоматически при первом запуске. */
export const MAIN_ADMIN: StaffMember = {
  id: 1,
  name: 'Директор (основной администратор)',
  email: 'director@clinic.ru',
  role: 'admin',
  password: 'director123',
  is_blocked: false,
  created_at: new Date().toISOString(),
};

export interface CreateStaffInput {
  name: string;
  email: string;
  role: 'admin' | 'manager';
  password: string;
}

interface StaffState {
  staff: StaffMember[];
  nextId: number;
  addStaff: (input: CreateStaffInput) => StaffMember;
  updateStaff: (id: number, patch: Partial<CreateStaffInput>) => void;
  toggleBlock: (id: number) => void;
  removeStaff: (id: number) => void;
  getByEmail: (email: string) => StaffMember | undefined;
  /** Пометить, что сотрудник вошёл (демо-режим) */
  touchLogin: (id: number) => void;
}

/**
 * Локальное хранилище сотрудников (Zustand + persist).
 * Нужно, чтобы раздел «Сотрудники» работал ДО подключения бэкенда.
 * Когда бэкенд реализует /admin/staff — замените обращения к этому стору
 * на вызовы API (см. ТЗ: модель admin_staff, роли admin/manager).
 */
export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: [MAIN_ADMIN],
      nextId: 2,

      addStaff: (input) => {
        let created!: StaffMember;
        set((s) => {
          created = {
            ...input,
            id: s.nextId,
            is_blocked: false,
            created_at: new Date().toISOString(),
          };
          return { staff: [...s.staff, created], nextId: s.nextId + 1 };
        });
        return created;
      },

      updateStaff: (id, patch) =>
        set((s) => ({
          staff: s.staff.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      toggleBlock: (id) =>
        set((s) => ({
          staff: s.staff.map((m) => (m.id === id ? { ...m, is_blocked: !m.is_blocked } : m)),
        })),

      removeStaff: (id) =>
        set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),

      getByEmail: (email) => get().staff.find((m) => m.email.toLowerCase() === email.toLowerCase()),

      touchLogin: (id) =>
        set((s) => ({
          staff: s.staff.map((m) =>
            m.id === id ? { ...m, last_login_at: new Date().toISOString() } : m,
          ),
        })),
    }),
    { name: 'denta_staff' },
  ),
);
