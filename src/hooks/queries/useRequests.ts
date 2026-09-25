'use client';

import { useQuery } from '@tanstack/react-query';
import { appointmentsAPI } from '@/lib/api/appointments';
import { normalizePage } from '@/lib/api/normalize';
import type { PageResult } from '@/types/api';
import type { Appointment } from '@/types/appointment';

const REQUEST_STATUSES = ['created'] as const;

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
 * Автообновление каждые 60 секунд.
 *
 * retry: 1      — при ошибке только 1 повтор (дефолт 3), иначе при ECONNABORTED
 *                 появляется шквал запросов каждые несколько секунд.
 * retryDelay    — пауза перед повтором 10 с.
 * refetchOnWindowFocus: false — не перезапрашивать при каждом переключении вкладки.
 */
export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      // Бэкенд принимает только: 'created' | 'confirmed' | 'completed' | 'cancelled'
      const createdRes = await appointmentsAPI.list({ source: 'client', status: 'created', limit: 50 });
      return normalizePage<Appointment>(createdRes.data, 1, 50);
    },
    refetchInterval: 60_000,          // раз в 60 сек — снижаем нагрузку на бэкенд
    refetchOnWindowFocus: false,       // не дублировать запрос при фокусе вкладки
    retry: 1,                          // 1 повтор при ошибке (вместо дефолтных 3)
    retryDelay: 10_000,                // пауза 10 с перед повтором
    placeholderData: (prev) => prev,
  });
}
