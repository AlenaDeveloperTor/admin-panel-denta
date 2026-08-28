'use client';

import { usersAPI } from '@/lib/api/users';
import type { User } from '@/types/user';

/**
 * По контракту бэкенда персональные push шлются по `patient_ids` (user_id),
 * а не по телефону. Если в распоряжении только телефон — ищем пользователя
 * по телефону и получаем его id.
 */

export async function resolvePhoneToUserId(phone: string): Promise<number | null> {
  try {
    const res = await usersAPI.list({ search: phone, limit: 20 });
    const items = (Array.isArray(res.data) ? res.data : (res.data as { items?: User[] })?.items ?? []) as User[];
    const match = items.find((u) => u.phone === phone);
    return match?.id ?? null;
  } catch {
    return null;
  }
}

export async function resolvePhonesToUserIds(
  phones: string[],
): Promise<{ ids: number[]; found: string[]; missing: string[] }> {
  const ids: number[] = [];
  const found: string[] = [];
  const missing: string[] = [];
  const seen = new Set<number>();

  await Promise.all(
    phones.map(async (phone) => {
      try {
        const res = await usersAPI.list({ search: phone, limit: 20 });
        const items = (Array.isArray(res.data) ? res.data : (res.data as { items?: User[] })?.items ?? []) as User[];
        const match = items.find((u) => u.phone === phone);
        if (match && !seen.has(match.id)) {
          seen.add(match.id);
          ids.push(match.id);
          found.push(phone);
        } else {
          missing.push(phone);
        }
      } catch {
        missing.push(phone);
      }
    }),
  );

  return { ids, found, missing };
}
