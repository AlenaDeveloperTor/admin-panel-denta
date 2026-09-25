import type { NextConfig } from 'next';

/**
 * Базовый URL бэкенда (FastAPI).
 * Админ-эндпоинты бэкенда монтируются как `{ADMIN_API_BASE}/admin/...`,
 * поэтому фронтенд ходит в `/admin-api/*`, а rewrite проксирует это в
 * `{ADMIN_API_BASE}/admin/*`. Такой подход:
 *  - убирает CORS (все запросы same-origin);
 *  - позволяет хранить JWT в httpOnly cookies на домене админки;
 *  - соответствует ТЗ: axios-клиент работает с относительными путями.
 */
const adminApiBase = process.env.ADMIN_API_BASE ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/admin-api/:path*',
        destination: `${adminApiBase}/admin/:path*`,
      },
    ];
  },
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
