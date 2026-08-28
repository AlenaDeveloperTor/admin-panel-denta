'use client';

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Единый axios-инстанс для админки.
 * baseURL = '/admin-api' → Next.js rewrite проксирует в {ADMIN_API_BASE}/admin/...
 * withCredentials: true — куки (httpOnly access_token/refresh_token) шлются автоматически.
 */
export const api = axios.create({
  baseURL: '/admin-api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Гарантируем один «полёт» refresh-запроса одновременно (single-flight) */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    // 1) Пытаемся обновить токен через бэкенд (куки обновятся автоматически)
    await api.post('/auth/refresh');
    return true;
  } catch {
    // 2) Fallback: собственный BFF-эндпоинт (если бэкенд вернул токены в body при логине)
    try {
      await axios.post('/api/session/refresh', undefined, { withCredentials: true });
      return true;
    } catch {
      return false;
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');
    const shouldRetry = status === 401 && original && !original._retry && !isAuthCall;

    if (shouldRetry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }
      const ok = await refreshPromise;
      if (ok) {
        return api(original);
      }
      // Не удалось обновить сессию → на страницу входа
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  }
);
