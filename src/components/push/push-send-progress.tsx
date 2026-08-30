'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { usePushTaskStatus } from '@/hooks/queries/usePush';
import { formatNumber } from '@/lib/utils';

/**
 * Модалка прогресса отправки рассылки.
 * Пока бэкенд не вернул task_id — показываем «формируем задачу»,
 * дальше опрашиваем GET /admin/push/task-status/{task_id}.
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
  const totalLabel = total > 0 ? formatNumber(total) : '…';

  const done = data?.status === 'completed' || data?.status === 'failed';
  const failedOverall = data?.status === 'failed';

  return (
    <Modal
      open={Boolean(taskId)}
      onClose={done || isError ? onClose : () => {}}
      title="Отправка рассылки"
      description="Уведомления доставляются клиентам"
      size="sm"
      footer={
        done || isError ? (
          <Button onClick={onClose}>Закрыть</Button>
        ) : (
          <p className="w-full text-center text-xs text-slate-400">
            Не закрывайте окно до завершения отправки
          </p>
        )
      }
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
              <p className="text-xs text-slate-400">Доставка обновляется каждые 15 сек...</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
