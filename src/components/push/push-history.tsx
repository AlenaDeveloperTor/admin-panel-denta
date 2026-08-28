'use client';

import { Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePushHistory } from '@/hooks/queries/usePush';
import { PUSH_STATUS_LABELS } from '@/types/push';
import type { PushHistoryItem, PushHistoryStatus } from '@/types/push';
import { formatDateTime, formatNumber } from '@/lib/utils';

const STATUS_TONES: Record<PushHistoryStatus, 'slate' | 'emerald' | 'amber' | 'rose' | 'sky'> = {
  pending: 'amber',
  in_progress: 'sky',
  sent: 'emerald',
  partial: 'amber',
  failed: 'rose',
};

export function PushHistory() {
  const { data: history, isLoading } = usePushHistory();

  return (
    <Card>
      <CardHeader
        title="История рассылок"
        subtitle="Все отправленные push-уведомления"
      />
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !history || history.length === 0 ? (
          <EmptyState
            title="Рассылок пока не было"
            description="Отправьте первое уведомление через форму выше"
            icon={<Megaphone className="h-8 w-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Дата</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Тема</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Аудитория</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Получателей</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Статус</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={String(item.id)}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                      {item.body && <p className="line-clamp-1 text-xs text-slate-400">{item.body}</p>}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {item.target === 'all' ? 'Все пациенты' : 'Выбранные пациенты'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatNumber(item.recipients_count)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONES[item.status]}>
                        {PUSH_STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
