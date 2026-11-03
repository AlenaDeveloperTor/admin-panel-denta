import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/csrf';

/** Очистка httpOnly-кук сессии */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ success: false, error: 'CSRF validation failed' }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('access_token', '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return res;
}
