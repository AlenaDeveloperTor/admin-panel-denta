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
};

export default nextConfig;
