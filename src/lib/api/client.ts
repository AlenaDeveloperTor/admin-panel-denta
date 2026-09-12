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
  let token = useAuthStore.getState().accessToken;
  if (!token && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('admin_auth_store');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.accessToken ?? null;
      }
    } catch {
      // ignore
    }
  }
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('[client.ts request] URL:', config.url, '| Bearer token:', token ? '✅ есть' : '❌ нет');
  return config;
});


type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Гарантируем один «полёт» refresh-запроса одновременно (single-flight) */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    console.log('[client.ts] Попытка обновить токен через /api/session/refresh (BFF)...');
    const res = await axios.post('/api/session/refresh', undefined, { withCredentials: true });
    // Если BFF вернул новый access_token — сохраняем в store
    if (res.data?.access_token) {
      useAuthStore.getState().setAccessToken(res.data.access_token);
    }
    console.log('[client.ts] ✅ Токен обновлен через BFF. Статус:', res.status);
    return true;
  } catch (e) {
    console.log('[client.ts] ❌ BFF refresh не прошел. Статус:', (e as AxiosError)?.response?.status, 'Сообщение:', (e as AxiosError)?.message);
    return false;
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
      console.log('[client.ts] 🔄 401 ошибка на:', url, '— пытаемся обновить токен...');
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }
      const ok = await refreshPromise;
      if (ok) {
        console.log('[client.ts] 🔁 Повторяем запрос после обновления');
        await new Promise(resolve => setTimeout(resolve, 500));
        return api(original);
      }
      // Не удалось обновить сессию → на страницу входа
      console.log('[client.ts] 🚫 Не удалось обновить токен → перенаправляем на /login');
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  }
);
