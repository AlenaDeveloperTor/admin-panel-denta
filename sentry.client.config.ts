import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

if (dsn && dsn.trim()) {
  Sentry.init({
    dsn: dsn.trim(),
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.2,
    debug: false,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  });

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as unknown as Record<string, unknown>).testGlitchTip = () => {
      Sentry.captureMessage('Тестовое сообщение из консоли админки');
      throw new Error('GlitchTip Test Error из консоли браузера');
    };
  }
}
