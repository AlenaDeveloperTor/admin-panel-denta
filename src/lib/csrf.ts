import { NextRequest } from 'next/server';

/**
 * Проверяет, что запрос пришел из того же источника (Same-Origin),
 * предотвращая CSRF-атаки на API-роуты сессии.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  // 1. Блокируем явные межсайтовые запросы (браузерный заголовок Sec-Fetch-Site)
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) {
    return true;
  }

  // 2. Проверяем заголовок Origin (отправляется браузером при POST/PUT/DELETE/PATCH)
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // 3. Если Origin отсутствует — проверяем Referer
  if (!origin) {
    const referer = req.headers.get('referer');
    if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) {
          return false;
        }
      } catch {
        return false;
      }
    }
  }

  return true;
}

