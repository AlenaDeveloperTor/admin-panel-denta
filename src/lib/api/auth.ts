import type { AdminUser, LoginResponse, PaginatedSessions, SessionRecord } from '@/types/auth';
import { api } from './client';

export const authAPI = {
  /** Вход сотрудника (email + password) */
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  /** Выход (бэкенд очищает cookie, плюс фронт чистит свою сессию) */
  logout: () => api.post('/auth/logout'),

  /** Обновление токена */
  refresh: () => api.post('/auth/refresh'),

  /** Текущий администратор */
  me: () => api.get<AdminUser>('/auth/me'),

  /**
   * История входов/выходов (обязательное требование ТЗ §1.2).
   * Бэкенд возвращает пагинированный объект: GET /admin/auth/sessions.
   */
  sessions: (page = 1, limit = 20) =>
    api.get<PaginatedSessions>('/auth/sessions', { params: { page, limit } }),
};
