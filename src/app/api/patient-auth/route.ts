/**
 * Публичный API-маршрут для авторизации пациентов на странице удаления аккаунта.
 * Проксирует запросы к мобильному бэкенду (/api/...), а НЕ к /admin/...
 * Используется исключительно для страницы /delete-account (Google Play Account Deletion).
 */

import { type NextRequest, NextResponse } from 'next/server';

const MOBILE_API_BASE =
  process.env.MOBILE_API_BASE ??
  process.env.ADMIN_API_BASE?.replace('/admin', '') ??
  'https://backend.stomatology.na4u.ru';

export async function POST(req: NextRequest) {
  const { action, ...body } = await req.json().catch(() => ({}));

  const endpointMap: Record<string, string> = {
    request_code: '/api/auth/request-code',
    verify_code: '/api/auth/verify-code',
    delete_account: '/api/users/me',
  };

  const path = endpointMap[action];
  if (!path) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const method = action === 'delete_account' ? 'DELETE' : 'POST';
  const authorization = req.headers.get('x-patient-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authorization) {
    headers['Authorization'] = `Bearer ${authorization}`;
  }

  try {
    const upstream = await fetch(`${MOBILE_API_BASE}${path}`, {
      method,
      headers,
      body: method === 'DELETE' ? undefined : JSON.stringify(body),
    });

    const responseText = await upstream.text();
    console.log(`[patient-auth] ${method} ${path} → ${upstream.status}:`, responseText);

    let data: unknown = null;
    try { data = JSON.parse(responseText); } catch { data = responseText; }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[patient-auth] fetch error:', err);
    return NextResponse.json(
      { error: 'Ошибка соединения с сервером. Попробуйте позже.' },
      { status: 502 }
    );
  }
}

