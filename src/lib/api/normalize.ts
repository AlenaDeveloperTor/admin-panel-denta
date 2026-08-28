import type { PageResult } from '@/types/api';

/**
 * Нормализует пагинированный ответ бэкенда.
 * Бэкенд может отдавать `per_page` или `limit`, поля могут приходить в `data`
 * как объект {items, total} или как массив. Учитываем оба варианта.
 */
export function normalizePage<T>(
  response: unknown,
  page = 1,
  limit = 20,
): PageResult<T> {
  const raw = response as
    | { data?: T[] | { items?: T[]; total?: number }; items?: T[]; total?: number; page?: number; per_page?: number; limit?: number }
    | T[]
    | null
    | undefined;

  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, page, perPage: limit, totalPages: Math.max(1, Math.ceil(raw.length / limit)) };
  }

  const nested = raw?.data;
  const items = Array.isArray(nested) ? nested : nested?.items ?? raw?.items ?? [];
  const total = Array.isArray(nested)
    ? nested.length
    : (nested?.total ?? raw?.total ?? items.length);
  const perPage = raw?.per_page ?? raw?.limit ?? limit;
  const current = raw?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return { items, total, page: current, perPage, totalPages };
}
