'use client';

import type { AdminRole } from '@/types/auth';
import type { StaffMember } from '@/types/staff';
import { useStaffStore } from '@/stores/useStaffStore';

/**
 * Демо-авторизация БЕЗ бэкенда.
 * В dev-режиме (JWT_SECRET пуст) proxy.ts декодирует JWT без проверки подписи,
 * поэтому достаточно положить токен с ролью в httpOnly-куку через BFF /api/session.
 * В production с JWT_SECRET этот вход работать не будет — это осознанно.
 */

function b64url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Генерация демо-JWT (подпись не проверяется в dev) */
export function createDemoToken(staff: {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      sub: String(staff.id),
      name: staff.name,
      email: staff.email,
      role: staff.role,
    }),
  );
  return `${header}.${payload}.${b64url('demo-signature')}`;
}

/** Вход в демо-режиме: сохраняет токен в httpOnly-куку и помечает последний вход */
export async function demoLogin(staff: StaffMember): Promise<void> {
  const token = createDemoToken(staff);
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  });
  if (!res.ok) {
    throw new Error('Не удалось установить демо-сессию');
  }
  useStaffStore.getState().touchLogin(staff.id);
}
