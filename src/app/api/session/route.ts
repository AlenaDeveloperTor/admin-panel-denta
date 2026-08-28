import { NextRequest, NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * BFF-fallback: если бэкенд при логине вернул токены в теле ответа
 * (а не Set-Cookie), сохраняем их в httpOnly-куки на домене админки.
 * Body: { access_token?, refresh_token? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { access_token, refresh_token } = body as { access_token?: string; refresh_token?: string };

  const res = NextResponse.json({ success: Boolean(access_token) });
  if (access_token) res.cookies.set('access_token', access_token, COOKIE_OPTIONS);
  if (refresh_token) res.cookies.set('refresh_token', refresh_token, COOKIE_OPTIONS);
  return res;
}
