import { type NextRequest, NextResponse } from 'next/server';

/**
 * Универсальный прокси-обработчик для маршрутов /admin-api/*.
 * Заменяет next.config rewrite, который в dev-режиме даёт socket hang up
 * при проксировании на внешние HTTPS-эндпоинты.
 *
 * Маршрут: /api/proxy/[...path] → ${ADMIN_API_BASE}/admin/[...path]
 *
 * Пример:
 *   /api/proxy/auth/login → https://backend.stomatology.na4u.ru/admin/auth/login
 */

const ADMIN_API_BASE = process.env.ADMIN_API_BASE ?? 'http://localhost:8000';

const FORWARDED_HEADERS = [
  'content-type',
  'authorization',
  'accept',
  'accept-language',
  'x-request-id',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-forwarded-proto',
];

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetUrl = `${ADMIN_API_BASE}/admin/${path.join('/')}`;

  // Прокидываем query string если есть
  const { search } = req.nextUrl;
  const url = search ? `${targetUrl}${search}` : targetUrl;

  // Собираем заголовки для пересылки
  const headers: Record<string, string> = {};
  for (const key of FORWARDED_HEADERS) {
    const val = req.headers.get(key);
    if (val) headers[key] = val;
  }

  // Прокидываем cookies (нужно для httpOnly refresh_token)
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: body ?? undefined,
      // @ts-expect-error — Node.js fetch поддерживает duplex для streaming
      duplex: body ? 'half' : undefined,
    });
  } catch (err) {
    console.error('[proxy] fetch error:', err);
    return NextResponse.json(
      { error: 'proxy_error', message: String(err) },
      { status: 502 }
    );
  }

  // Пересылаем Set-Cookie из бэкенда (для httpOnly токенов)
  const responseHeaders = new Headers();
  const setCookie = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookie) {
    responseHeaders.append('set-cookie', cookie);
  }

  // Пробрасываем Content-Type
  const ct = upstream.headers.get('content-type');
  if (ct) responseHeaders.set('content-type', ct);

  const responseBody = await upstream.arrayBuffer();

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
