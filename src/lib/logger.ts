import * as Sentry from '@sentry/nextjs';

/**
 * Логирует исключение или ошибку в GlitchTip.
 */
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): void {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
}

/**
 * Логирует информационное сообщение в GlitchTip.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

/**
 * Привязывает администратора/пользователя к сессии GlitchTip.
 */
export function setLoggerUser(user: {
  id: string | number;
  phone?: string;
  username?: string;
  email?: string;
} | null): void {
  if (!user) {
    Sentry.setUser(null);
  } else {
    Sentry.setUser({
      id: String(user.id),
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
  }
}

/**
 * Вспомогательная функция для проверки отправки в GlitchTip из админки.
 */
export function testGlitchTipAdminCrash(): void {
  captureMessage('Тестовое сообщение GlitchTip из веб-админки', 'warning', {
    platform: 'admin-panel',
    timestamp: new Date().toISOString(),
  });
  throw new Error('GlitchTip Test Error: проверка отслеживания ошибок в веб-админке!');
}

export { Sentry };
