import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/csrf';
import { jwtVerify, decodeJwt } from 'jose';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 дней — совпадает с TTL refresh_token на бэкенде
};

/**
 * BFF-fallback: если бэкенд при логине вернул токены в теле ответа
 * (а не Set-Cookie), сохраняем их в httpOnly-куки на домене админки.
 * Body: { access_token?, refresh_token? }
 */
export async function POST(req: NextRequest) {
  // CSRF-защита: проверка источника запроса
  if (!isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: 'forbidden', message: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // Требуем кастомный заголовок X-Requested-With (не может быть отправлен кросс-сайтово без CORS)
  const xRequestedWith = req.headers.get('x-requested-with');
  if (xRequestedWith !== 'XMLHttpRequest') {
    return NextResponse.json(
      { error: 'bad_request', message: 'Missing or invalid CSRF request header' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { access_token, refresh_token } = body as { access_token?: string; refresh_token?: string };

  if (!access_token && !refresh_token) {
    return NextResponse.json(
      { error: 'bad_request', message: 'No tokens provided' },
      { status: 400 }
    );
  }

  // Валидация формата access_token перед установкой в сессионную куку
  if (access_token) {
    try {
      if (process.env.JWT_SECRET) {
        await jwtVerify(access_token, new TextEncoder().encode(process.env.JWT_SECRET), {
          clockTolerance: 60,
        });
      } else {
        decodeJwt(access_token);
      }
    } catch {
      return NextResponse.json(
        { error: 'invalid_token', message: 'Invalid access token format or signature' },
        { status: 400 }
      );
    }
  }

  const res = NextResponse.json({ success: Boolean(access_token) });
  if (access_token) res.cookies.set('access_token', access_token, COOKIE_OPTIONS);
  if (refresh_token) res.cookies.set('refresh_token', refresh_token, COOKIE_OPTIONS);
  return res;
}
