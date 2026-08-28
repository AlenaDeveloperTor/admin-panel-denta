'use client';

import { isAxiosError } from 'axios';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSessions } from '@/hooks/queries/useAuth';
import { formatDateTime } from '@/lib/utils';
import type { SessionRecord } from '@/types/auth';

const columns: ColumnDef<SessionRecord>[] = [
  {
    accessorKey: 'created_at',
    header: 'Время',
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-medium">{formatDateTime(row.original.created_at)}</span>
    ),
  },
  {
    accessorKey: 'user_email',
    header: 'Сотрудник',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.user_name || row.original.user_email}</p>
        {row.original.user_name && (
          <p className="text-xs text-slate-400">{row.original.user_email}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Действие',
    cell: ({ row }) =>
      row.original.action === 'login' ? (
        <Badge tone="emerald">Вход</Badge>
      ) : (
        <Badge tone="rose">Выход</Badge>
      ),
  },
  {
    accessorKey: 'ip',
    header: 'IP',
    cell: ({ row }) => row.original.ip ?? '—',
  },
  {
    accessorKey: 'user_agent',
    header: 'Устройство',
    cell: ({ row }) => (
      <span className="block max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">
        {row.original.user_agent ?? '—'}
      </span>
    ),
  },
];

/**
 * Журнал входов/выходов сотрудников (обязательное требование ТЗ §1.2).
 * Бэкенд должен реализовать GET /admin/auth/sessions.
 */
export function SessionsList() {
  const { data, isLoading, error } = useSessions();

  const notImplemented = isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405);

  return (
    <Card>
      <CardHeader
        title="История входов и выходов"
        subtitle="Кто и когда отвечал за записи, push-уведомления и работу с клиентами"
      />
      <CardContent>
        {notImplemented ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            Бэкенд ещё не реализовал эндпоинт <code className="font-mono">GET /admin/auth/sessions</code>.
            Журнал входов/выходов появится здесь автоматически после его добавления.
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            loading={isLoading}
            emptyTitle="Записей о входах пока нет"
            emptyDescription="После первого входа журнал начнёт заполняться"
          />
        )}
      </CardContent>
    </Card>
  );
}
