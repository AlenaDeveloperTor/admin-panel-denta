'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/useAuthStore';

/** Текущий администратор */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authAPI.me();
      setUser(res.data ?? null);
      return res.data;
    },
    // Если бэкенд не реализовал /auth/me — молча пропускаем
    retry: false,
  });
}

/** История входов/выходов (ТЗ §1.2) */
export function useSessions() {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authAPI.sessions().then((r) => r.data),
    retry: false,
  });
}

/** Выход: чистим куки + стор */
export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await authAPI.logout().catch(() => undefined);
      await fetch('/api/session/logout', { method: 'POST' });
    },
    onSuccess: () => {
      clear();
      qc.clear();
    },
  });
}
