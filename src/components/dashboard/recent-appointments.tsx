'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useRecentAppointments } from '@/hooks/queries/useAppointments';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardHeader } from '@/components/ui/card';
import { fullName } from '@/types/user';
import { appointmentDate, appointmentTime } from '@/types/appointment';
import type { Appointment } from '@/types/appointment';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'patient',
    header: 'Пациент',
    cell: ({ row }) => {
      const p = row.original.patient;
      return <span className="font-medium">{fullName(p)}</span>;
    },
  },
  {
    accessorKey: 'service',
    header: 'Услуга',
    cell: ({ row }) => row.original.service?.name ?? '—',
  },
  {
    accessorKey: 'appointment_datetime',
    header: 'Время',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {row.original.appointment_datetime
          ? `${formatDate(appointmentDate(row.original) ?? '')} · ${appointmentTime(row.original)}`
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export function RecentAppointments() {
  const { data, isLoading } = useRecentAppointments(5);

  return (
    <Card>
      <CardHeader
        title="Последние записи"
        action={
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Все записи <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        emptyTitle="Записей пока нет"
        emptyDescription="Новые записи появятся здесь"
      />
    </Card>
  );
}
