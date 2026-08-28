'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Что-то пошло не так</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {error.message || 'Произошла непредвиденная ошибка. Попробуйте ещё раз.'}
        </p>
      </div>
      <Button onClick={reset}>Повторить</Button>
    </div>
  );
}
