'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, PhoneCall } from 'lucide-react';
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

  // Сортируем: записи без назначенной даты (требующие созвона) ВСЕГДА первыми
  const sortedAppointments = useMemo(() => {
    const unscheduled: Appointment[] = [];
    const scheduled: Appointment[] = [];

    for (const a of appointments) {
      if (!a.appointment_datetime && a.status === 'confirmed') {
        unscheduled.push(a);
      } else {
        scheduled.push(a);
      }
    }

    return [...unscheduled, ...scheduled];
  }, [appointments]);

  const unscheduledCount = useMemo(
    () => appointments.filter((a) => !a.appointment_datetime && a.status === 'confirmed').length,
    [appointments],
  );

  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageData = useMemo(
    () => sortedAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedAppointments, page],
  );

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        accessorKey: 'appointment_datetime',
        header: 'Время визита',
        cell: ({ row }) => {
          if (!row.original.appointment_datetime) {
            return (
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-xs dark:bg-amber-950/60 dark:text-amber-300">
                <PhoneCall className="h-3.5 w-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
                <span>Дата не назначена · Созвониться</span>
              </div>
            );
          }
          return (
            <div className="whitespace-nowrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDateTimeInTimeZone(row.original.appointment_datetime, timeZone)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'patient',
        header: 'Пациент',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 dark:text-slate-100">{fullName(row.original.patient)}</span>
            {row.original.patient?.phone && (
              <span className="text-xs text-slate-400">{row.original.patient.phone}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'service',
        header: 'Услуга',
        cell: ({ row }) => row.original.service?.name ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => {
          const isUnscheduled = !row.original.appointment_datetime && row.original.status === 'confirmed';
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge status={row.original.status} />
              {isUnscheduled && (
                <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  Ждёт звонка
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isUnscheduled = !row.original.appointment_datetime && row.original.status === 'confirmed';
          if (isUnscheduled) {
            return (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(row.original);
                }}
              >
                <Calendar className="h-3.5 w-3.5" />
                Назначить дату
              </Button>
            );
          }
          return (
            <Button variant="ghost" size="icon" onClick={() => onSelect(row.original)} aria-label="Открыть">
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [onSelect, timeZone],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {unscheduledCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <PhoneCall className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Требуют созвона ({unscheduledCount}):</strong> подтверждённые записи без назначенной даты. Свяжитесь с клиентом для выбора времени визита.
            </span>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={pageData}
        loading={loading}
        onRowClick={onSelect}
        rowClassName={(item) =>
          !item.appointment_datetime && item.status === 'confirmed'
            ? 'bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 border-l-4 border-l-amber-500 font-medium'
            : ''
        }
        emptyTitle="Записи не найдены"
        emptyDescription="Измените фильтры или создайте новую запись"
      />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} total={sortedAppointments.length} />
    </div>
  );
}
