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

// Логирование куков перед каждым запросом
api.interceptors.request.use((config) => {
  const cookieStr = document.cookie;
  const hasAccess = cookieStr.includes('access_token');
  console.log('[client.ts request] URL:', config.url, '| Cookie access_token:', hasAccess ? '✅ есть' : '❌ нет');
  return config;
});


type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Гарантируем один «полёт» refresh-запроса одновременно (single-flight) */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    // Используем BFF эндпоинт для обновления токена
    // BFF видит httpOnly куки и может отправить refresh_token в body бэкенду
    console.log('[client.ts] Попытка обновить токен через /api/session/refresh (BFF)...');
    console.log('[client.ts] Текущие куки:', document.cookie);
    const res = await axios.post('/api/session/refresh', undefined, { withCredentials: true });
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
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms для видимости
        return api(original);
      }
      // Не удалось обновить сессию → на страницу входа
      console.log('[client.ts] 🚫 Не удалось обновить токен → перенаправляем на /login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  }
);
