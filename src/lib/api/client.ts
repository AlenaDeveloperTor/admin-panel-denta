'use client';

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Единый axios-инстанс для админки.
 * baseURL = '/admin-api' → Next.js rewrite проксирует в {ADMIN_API_BASE}/admin/...
 * withCredentials: true — куки (httpOnly access_token/refresh_token) шлются автоматически.
 * Authorization: Bearer — токен берётся из Zustand store (in-memory) и подставляется в каждый запрос.
 */
export const api = axios.create({
  baseURL: '/admin-api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Подставляем Bearer token перед каждым запросом
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * Single-flight refresh: пока идёт один запрос на обновление,
 * все параллельные 401 ждут его результата — и НЕ запускают свой.
 * Promise не обнуляется до тех пор, пока все ожидающие не получили результат.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  const res = await axios.post<{ ok: boolean; access_token?: string }>(
    '/api/session/refresh',
    undefined,
    { withCredentials: true }
  );
  // BFF возвращает новый access_token в теле
  const newToken = res.data?.access_token ?? null;
  if (newToken) {
    useAuthStore.getState().setAccessToken(newToken);
  }
  return newToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');
    const shouldRetry = status === 401 && original && !original._retry && !isAuthCall;

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    // Помечаем сразу — чтобы параллельные запросы, ожидающие того же refreshPromise,
    // не пытались запустить ещё один refresh после того как первый завершился
    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshSession().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newToken = await refreshPromise;

      // Явно проставляем свежий токен в заголовок повторного запроса,
      // не полагаясь на то, что request interceptor успеет прочитать store
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers['Authorization'] = `Bearer ${newToken}`;
      }

      return api(original);
    } catch {
      // Refresh не удался — сессия невалидна, выкидываем на логин
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1';
      }
      return Promise.reject(error);
    }
  }
);
