import type { StaffMember } from '@/types/staff';
import { api } from './client';

/**
 * API сотрудников (по контракту бэкенда, project_tasks.md §4.9).
 * Доступ только для роли admin.
 */
export interface StaffCreateInput {
  name: string;
  email: string;
  role: 'admin' | 'manager';
  password: string;
}

/** Поля для обновления (все опциональны; password — только при смене, is_blocked — блокировка) */
export type StaffUpdateInput = Partial<StaffCreateInput> & { is_blocked?: boolean };

export const staffAPI = {
  /** Список сотрудников */
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<StaffMember[]>('/staff', { params }),

  /** Создать сотрудника */
  create: (input: StaffCreateInput) => api.post<StaffMember>('/staff', input),

  /** Обновить сотрудника */
  update: (id: number, input: StaffUpdateInput) =>
    api.patch<StaffMember>(`/staff/${id}`, input),

  /** Удалить сотрудника */
  remove: (id: number) => api.delete(`/staff/${id}`),
};
