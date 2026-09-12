'use client';

import { useEffect } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { usePushTaskStatus } from '@/hooks/queries/usePush';
import { formatNumber } from '@/lib/utils';

/**
 * Модалка прогресса отправки рассылки.
 * Пока бэкенд не вернул task_id — показываем «формируем задачу»,
 * дальше опрашиваем GET /admin/push/task-status/{task_id}.
 * Авто-закрывается через 3 секунды после завершения.
 */
export function PushSendProgress({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const { data, isError } = usePushTaskStatus(taskId);

  const total = data?.total ?? 0;
  const accept = data?.accept ?? 0;
  const sent = data?.sent ?? 0;
  const failed = data?.failed ?? 0;
  const progress = data?.progress ?? (total > 0 ? Math.round((accept / total) * 100) : 0);

  const done =
    data?.status === 'completed' ||
    data?.status === 'sent' ||
    data?.status === 'partial' ||
    data?.status === 'failed' ||
    progress >= 100 ||
    (total > 0 && accept + failed >= total);
  const failedOverall = data?.status === 'failed';

  // Авто-закрытие через 3 секунды после завершения
  useEffect(() => {
    if (!done && !isError) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [done, isError, onClose]);

  return (
    <Modal
      open={Boolean(taskId)}
      onClose={done || isError ? onClose : () => {}}
      title="Отправка рассылки"
      description="Уведомления доставляются клиентам"
      size="sm"
      footer={<Button onClick={onClose}>{done || isError ? 'Закрыть' : 'Скрыть'}</Button>}
    >
      <div className="space-y-4 py-2">
        {isError || failedOverall ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle className="h-10 w-10 text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isError
                ? 'Не удалось получить статус отправки. Проверьте историю рассылок.'
                : 'При отправке произошла ошибка. Часть уведомлений могла быть доставлена.'}
            </p>
            <p className="text-xs text-slate-400">Окно закроется автоматически через 3 секунды</p>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Рассылка завершена
            </p>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p>Отправлено в Expo: {formatNumber(accept)}</p>
              <p>Доставлено: {formatNumber(sent)} · Ошибок: {formatNumber(failed)}</p>
            </div>
            <p className="text-xs text-slate-400">Окно закроется автоматически через 3 секунды</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand-600 dark:text-brand-400" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {taskId ? `В Expo: ${formatNumber(accept)} · Доставлено: ${formatNumber(sent)}` : 'Формируем задачу…'}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{progress}%</p>
            {taskId && accept > 0 && sent < accept && (
              <p className="text-xs text-slate-400">Доставка обновляется каждые 2 сек...</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
