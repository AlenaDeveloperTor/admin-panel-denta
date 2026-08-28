import { NextRequest, NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * BFF-fallback для обновления сессии:
 * серверно вызывает бэкенд /admin/auth/refresh с текущими куками,
 * пробрасывает новые Set-Cookie (или токены из body) обратно в браузер.
 */
export async function POST(req: NextRequest) {
  const base = process.env.ADMIN_API_BASE ?? 'http://localhost:8000';
  const cookieHeader = req.headers.get('cookie') ?? '';

  try {
    const backendRes = await fetch(`${base}/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!backendRes.ok) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const data = await backendRes.json().catch(() => ({}));
    const out = NextResponse.json({ ok: true });

    // Пробрасываем Set-Cookie от бэкенда
    const setCookies = backendRes.headers.getSetCookie?.() ?? [];
    for (const sc of setCookies) {
      const nameVal = sc.split(';')[0];
      const idx = nameVal.indexOf('=');
      if (idx === -1) continue;
      out.cookies.set(nameVal.slice(0, idx).trim(), nameVal.slice(idx + 1).trim(), COOKIE_OPTIONS);
    }

    // Либо токены из тела ответа
    const body = data as { access_token?: string; refresh_token?: string };
    if (body.access_token) out.cookies.set('access_token', body.access_token, COOKIE_OPTIONS);
    if (body.refresh_token) out.cookies.set('refresh_token', body.refresh_token, COOKIE_OPTIONS);

    return out;
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
