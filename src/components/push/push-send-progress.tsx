'use client';

import { useEffect } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { usePushTaskStatus } from '@/hooks/queries/usePush';
import { formatNumber } from '@/lib/utils';

/**
 * Модалка прогресса отправки рассылки.
 * Опрашивает GET /admin/push/task-status/{task_id} каждые 2 сек.
 *
 * Схема ответа бэкенда:
 *   { task_id, status, total, accepted, sent, failed, progress }
 *
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

  const total    = data?.total    ?? 0;
  const accepted = data?.accepted ?? 0;   // принято Expo (поле "accepted" в API)
  const sent     = data?.sent     ?? 0;   // реально доставлено пользователям
  const failed   = data?.failed   ?? 0;
  const progress = data?.progress ?? 0;

  const done =
    data?.status === 'completed' ||
    data?.status === 'sent'      ||
    data?.status === 'partial'   ||
    data?.status === 'failed'    ||
    progress >= 100              ||
    (total > 0 && accepted + failed >= total);

  const failedOverall = data?.status === 'failed' && accepted === 0;

  // Авто-закрытие через 3 секунды после завершения
  useEffect(() => {
    if (!done && !isError) return;
    const timer = setTimeout(onClose, 3000);
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

        {/* ── Ошибка ── */}
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

        /* ── Завершено ── */
        ) : done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-[#172933] dark:text-slate-200">
              Рассылка завершена
            </p>
            <StatCard total={total} accepted={accepted} sent={sent} failed={failed} />
            <p className="text-xs text-slate-400">Окно закроется автоматически через 3 секунды</p>
          </div>

        /* ── В процессе ── */
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#aac6ee]" />
            <p className="text-sm font-medium text-[#172933] dark:text-slate-200">
              {taskId ? 'Идёт отправка…' : 'Формируем задачу…'}
            </p>

            {/* Прогресс-бар */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#172933] transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{progress}%</p>

            {/* Счётчики — видны сразу как только данные начали приходить */}
            {taskId && <StatCard total={total} accepted={accepted} sent={sent} failed={failed} />}

            {taskId && accepted > 0 && sent < accepted && (
              <p className="text-xs text-slate-400">Обновляется каждые 2 сек...</p>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}

/** Карточка с разбивкой счётчиков (переиспользуется в состоянии «в процессе» и «завершено») */
function StatCard({
  total,
  accepted,
  sent,
  failed,
}: {
  total: number;
  accepted: number;
  sent: number;
  failed: number;
}) {
  return (
    <div className="w-full rounded-xl bg-[#eef4fb] px-4 py-3 text-left space-y-1.5 dark:bg-slate-800">
      {total > 0 && (
        <Row label="Всего получателей" value={formatNumber(total)} />
      )}
      <Row label="Принято Expo" value={formatNumber(accepted)} />
      <Row label="Доставлено" value={formatNumber(sent)} color="emerald" />
      {failed > 0 && (
        <Row label="Ошибок" value={formatNumber(failed)} color="rose" />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'emerald' | 'rose';
}) {
  const valueClass =
    color === 'emerald'
      ? 'font-medium text-emerald-600'
      : color === 'rose'
      ? 'font-medium text-rose-500'
      : 'font-medium text-[#172933] dark:text-slate-200';
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
