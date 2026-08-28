import type { CreateUserInput, UpdateUserInput, User } from '@/types/user';
import { api } from './client';

export const usersAPI = {
  /** Список пациентов с пагинацией и поиском (по ТЗ: page + limit + search) */
  list: (params: { page?: number; limit?: number; search?: string; has_points?: boolean }) =>
    api.get('/users', { params }),

  /** Детали пациента */
  getById: (id: number) => api.get<User>(`/users/${id}`),

  /** Создать пациента */
  create: (input: CreateUserInput) => api.post<User>('/users', input),

  /** Обновить пациента */
  update: (id: number, input: UpdateUserInput) => api.patch<User>(`/users/${id}`, input),

  /** Удалить пациента */
  remove: (id: number) => api.delete(`/users/${id}`),
};
