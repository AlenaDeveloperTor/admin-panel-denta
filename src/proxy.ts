import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

/**
 * Защита роутов админки (Next.js 16: файл называется proxy.ts, ранее middleware.ts).
 *
 * Правила (ТЗ §1.2):
 *  - доступ к /dashboard, /patients, /appointments, /services, /settings и др.
 *    только с валидным JWT и ролью admin в payload;
 *  - иначе — редирект на /login;
 *  - авторизованный пользователь на /login перенаправляется на /dashboard.
 *
 * Проверка подписи:
 *  - если задан JWT_SECRET — токен проверяется подписью через jose;
 *  - если не задан — токен декодируется БЕЗ проверки подписи (только для dev,
 *    чтобы админка работала с реальным бэкендом до настройки общего секрета).
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/patients',
  '/requests',
  '/appointments',
  '/services',
  '/news',
  '/loyalty',
  '/push',
  '/settings',
  '/staff',
];

/** Разделы только для роли admin (директор) */
const ADMIN_ONLY_PREFIXES = ['/staff'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Любой сотрудник панели (admin или manager) */
function isStaffPayload(payload: Record<string, unknown>): boolean {
  const role = payload.role ?? payload.role_name ?? payload.user_role;
  return role === 'admin' || role === 'manager' || payload.is_admin === true;
}

/** Только администратор (полный доступ, управление сотрудниками) */
function isAdminPayload(payload: Record<string, unknown>): boolean {
  const role = payload.role ?? payload.role_name ?? payload.user_role;
  return role === 'admin' || payload.is_admin === true;
}

async function decodeToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    if (process.env.JWT_SECRET) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      return payload as Record<string, unknown>;
    }
    return decodeJwt(token) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value;
  const payload = token ? await decodeToken(token) : null;
  const isStaff = payload ? isStaffPayload(payload) : false;
  const isAdmin = payload ? isAdminPayload(payload) : false;
  const isLogin = pathname === '/login';

  if (isProtectedPath(pathname) && !isStaff) {
    const url = new URL('/login', req.url);
    return NextResponse.redirect(url);
  }

  // Разделы только для admin: остальных перенаправляем на дашборд
  if (isAdminOnlyPath(pathname) && !isAdmin) {
    const url = new URL('/dashboard', req.url);
    return NextResponse.redirect(url);
  }

  if (isLogin && isStaff) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
