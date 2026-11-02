import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN || process.env.GLITCHTIP_DSN;

if (dsn && dsn.trim()) {
  Sentry.init({
    dsn: dsn.trim(),
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.2,
    debug: false,
  });
}
