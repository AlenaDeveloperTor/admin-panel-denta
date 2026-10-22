'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useSessions } from '@/hooks/queries/useAuth';
import { formatDateTime } from '@/lib/utils';
import type { SessionRecord } from '@/types/auth';

const LIMIT = 20;

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

/** Журнал входов/выходов сотрудников (обязательное требование ТЗ §1.2). */
export function SessionsList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSessions(page, LIMIT);

  const hasError = isAxiosError(error);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Card>
      <CardHeader
        title="История входов и выходов"
        subtitle="Кто и когда отвечал за записи, push-уведомления и работу с клиентами"
      />
      <CardContent>
        {hasError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            Не удалось загрузить журнал входов. Проверьте подключение или обратитесь к администратору.
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={items}
              loading={isLoading}
              emptyTitle="Записей о входах пока нет"
              emptyDescription="После первого входа журнал начнёт заполняться"
            />
            {!isLoading && items.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                total={total}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
