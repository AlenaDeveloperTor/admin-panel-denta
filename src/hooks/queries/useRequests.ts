'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentsAPI } from '@/lib/api/appointments';
import { normalizePage } from '@/lib/api/normalize';
import type { PageResult } from '@/types/api';
import type { Appointment } from '@/types/appointment';

const REQUEST_STATUSES = ['pending', 'created'] as const;

/** Статусы, которые считаются «новыми заявками» */
export function isRequestStatus(status: Appointment['status']): boolean {
  return (REQUEST_STATUSES as readonly string[]).includes(status);
}

/** Объединение двух пагинированных ответов без дубликатов по id */
function mergePageResults(a: PageResult<Appointment>, b: PageResult<Appointment>): PageResult<Appointment> {
  const seen = new Set<string>();
  const items = [...a.items, ...b.items].filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items, total: items.length, page: 1, perPage: Math.max(a.perPage, b.perPage), totalPages: 1 };
}

/**
 * Новые заявки на запись от клиентов (статус pending/created).
 * Бэкенд принимает заявку из мобильного приложения → админ видит её здесь.
 * Автообновление каждые 30 секунд + по refetchOnWindowFocus.
 */
export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const [pendingRes, createdRes] = await Promise.all([
        appointmentsAPI.list({ status: 'pending', limit: 50 }),
        appointmentsAPI.list({ status: 'created', limit: 50 }),
      ]);
      const pending = normalizePage<Appointment>(pendingRes.data, 1, 50);
      const created = normalizePage<Appointment>(createdRes.data, 1, 50);
      return mergePageResults(pending, created);
    },
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}
