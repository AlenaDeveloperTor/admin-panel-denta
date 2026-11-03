import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

/**
 * Проксирование запросов к бэкенду (FastAPI) реализовано через Route Handler:
 *   src/app/api/proxy/[...path]/route.ts
 *
 * Это позволяет надёжно проксировать внешние HTTPS-эндпоинты в dev-режиме
 * (next.config rewrites давали socket hang up на Windows с HTTPS-бэкендом).
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Применяем ко всем страницам админки
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            // unsafe-eval нужен для zodResolver и динамической компиляции клиентских бандлов Next.js
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Для GlitchTip отключаем отправку телеметрии в облако Sentry SaaS
  telemetry: false,
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
