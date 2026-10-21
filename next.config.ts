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
            key: 'Content-Security-Policy',
            // unsafe-eval нужен для zodResolver и некоторых Next.js-зависимостей
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
