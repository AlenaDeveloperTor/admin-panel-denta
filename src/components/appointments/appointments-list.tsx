'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { fullName } from '@/types/user';
import type { Appointment } from '@/types/appointment';
import { formatDateTimeInTimeZone } from '@/lib/utils';

const PAGE_SIZE = 15;

export function AppointmentsList({
  appointments,
  loading,
  onSelect,
  timeZone,
}: {
  appointments: Appointment[];
  loading?: boolean;
  onSelect: (appointment: Appointment) => void;
  timeZone: string;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageData = useMemo(
    () => appointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [appointments, page],
  );

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: 'appointment_datetime',
        header: 'Время',
        cell: ({ row }) => {
          if (!row.original.appointment_datetime) {
            return <span className="text-slate-400">—</span>;
          }
          return (
            <div className="whitespace-nowrap">
              <span className="font-semibold">
                {formatDateTimeInTimeZone(row.original.appointment_datetime, timeZone)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'patient',
        header: 'Пациент',
        cell: ({ row }) => <span className="font-medium">{fullName(row.original.patient)}</span>,
      },
      {
        accessorKey: 'service',
        header: 'Услуга',
        cell: ({ row }) => row.original.service?.name ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => onSelect(row.original)} aria-label="Открыть">
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [onSelect, timeZone],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <DataTable
        columns={columns}
        data={pageData}
        loading={loading}
        onRowClick={onSelect}
        emptyTitle="Записи не найдены"
        emptyDescription="Измените фильтры или создайте новую запись"
      />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} total={appointments.length} />
    </div>
  );
}
