import { NextResponse } from 'next/server';

/** Очистка httpOnly-кук сессии */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('access_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
