import type { CreateUserInput, UpdateUserInput, User } from '@/types/user';
import { api } from './client';
import { normalizePage } from './normalize';

export const usersAPI = {
  /** Список пациентов с пагинацией и поиском (по ТЗ: page + limit + search) */
  list: (params: { page?: number; limit?: number; search?: string; has_points?: boolean; date_from?: string; date_to?: string }) =>
    api.get('/users', { params }),

  /** Детали пациента */
  getById: (id: number) => api.get<User>(`/users/${id}`),

  /** Создать пациента */
  create: (input: CreateUserInput) => api.post<User>('/users', input),

  /** Обновить пациента */
  update: (id: number, input: UpdateUserInput) => api.patch<User>(`/users/${id}`, input),

  /** Удалить пациента */
  remove: (id: number) => api.delete(`/users/${id}`),
};

/**
 * Загружает всех пациентов клиники (обходит пагинацию с limit=100).
 * Используется для фильтрации по годам рождения и сопоставления с IDENT.
 */
export async function fetchAllPatients(): Promise<User[]> {
  const firstRes = await usersAPI.list({ page: 1, limit: 100 });
  const firstPage = normalizePage<User>(firstRes.data, 1, 100);
  let all: User[] = [...firstPage.items];

  if (firstPage.totalPages > 1) {
    const promises = [];
    for (let p = 2; p <= firstPage.totalPages; p++) {
      promises.push(usersAPI.list({ page: p, limit: 100 }));
    }
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
      const pageResult = normalizePage<User>(results[i].data, i + 2, 100);
      all = all.concat(pageResult.items);
    }
  }

  // Дедупликация по id
  const seen = new Set<number>();
  return all.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

