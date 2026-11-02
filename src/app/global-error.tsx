'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Автоматически отправляем ошибку в GlitchTip
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Произошла непредвиденная ошибка</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Мы зафиксировали сбой и отправили отчёт в систему мониторинга.
          </p>
          <button
            onClick={() => reset()}
            className="w-full px-5 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition active:scale-[0.98]"
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
