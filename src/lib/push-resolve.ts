'use client';

import { usersAPI } from '@/lib/api/users';
import { normalizePage } from '@/lib/api/normalize';
import { normalizePushPhone } from '@/schemas/push';
import type { User } from '@/types/user';

/**
 * По контракту бэкенда персональные push шлются по `patient_ids` (user_id),
 * а не по телефону. Если в распоряжении только телефон — ищем пользователя
 * по телефону и получаем его id.
 */

export async function resolvePhoneToUserId(phone: string): Promise<number | null> {
  try {
    const rawDigits = phone.replace(/\D/g, '');
    const normalized = normalizePushPhone(phone);
    const res = await usersAPI.list({ search: normalized || phone, limit: 20 });
    const page = normalizePage<User>(res.data, 1, 20);
    const items = page.items;
    const match = items.find((u) => {
      if (!u.phone) return false;
      if (u.phone === phone || u.phone === normalized) return true;
      const uDigits = u.phone.replace(/\D/g, '');
      return uDigits === rawDigits;
    });
    return match?.id ? Number(match.id) : null;
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
        const rawDigits = phone.replace(/\D/g, '');
        const normalized = normalizePushPhone(phone);
        const res = await usersAPI.list({ search: normalized || phone, limit: 20 });
        const page = normalizePage<User>(res.data, 1, 20);
        const items = page.items;
        const match = items.find((u) => {
          if (!u.phone) return false;
          if (u.phone === phone || u.phone === normalized) return true;
          return u.phone.replace(/\D/g, '') === rawDigits;
        });
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

