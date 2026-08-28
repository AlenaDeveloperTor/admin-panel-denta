import type { AdminUser, LoginResponse, SessionRecord } from '@/types/auth';
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
   * Бэкенд должен предоставить GET /admin/auth/sessions.
   */
  sessions: () => api.get<SessionRecord[]>('/auth/sessions'),
};
