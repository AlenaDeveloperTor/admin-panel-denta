'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Download, LayoutList, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AppointmentsCalendar } from '@/components/appointments/appointments-calendar';
import { AppointmentsList } from '@/components/appointments/appointments-list';
import { AppointmentDetail } from '@/components/appointments/appointment-detail';
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal';
import { useAppointments } from '@/hooks/queries/useAppointments';
import { useAppointmentFilters } from '@/stores/useAppointmentFilters';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUSES } from '@/types/appointment';
import type { AppointmentFilters } from '@/types/appointment';
import { fullName } from '@/types/user';
import { exportToCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { settingsAPI } from '@/lib/api/settings';
import { useQuery } from '@tanstack/react-query';

type View = 'list' | 'calendar';

export default function AppointmentsPage() {
  const { filters, setFilters, resetFilters } = useAppointmentFilters();
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();

  const { data, isLoading, isFetching } = useAppointments(filters);
  const { data: clinicSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((response) => response.data),
    retry: false,
  });
  const clinicTimeZone = clinicSettings?.timezone ?? 'Europe/Moscow';

  const appointments = useMemo(() => data?.items ?? [], [data]);

  const handleExport = () => {
    exportToCsv(
      appointments.map((a) => ({
        datetime: a.appointment_datetime ?? '',
        patient: fullName(a.patient),
        phone: a.patient?.phone ?? '',
        service: a.service?.name ?? '',
        status: APPOINTMENT_STATUS_LABELS[a.status] ?? a.status,
        comment: a.comment ?? '',
      })),
      `appointments_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const openCreate = (date?: string) => {
    setCreateDate(date);
    setCreateOpen(true);
  };

  const hasActiveFilters = Boolean(filters.status || filters.date_from || filters.date_to);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Записи"
        subtitle={`Показано: ${appointments.length}`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={!appointments.length}>
              <Download className="h-4 w-4" /> Экспорт CSV
            </Button>
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Создать запись
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Дата с"
                type="date"
                value={filters.date_from ?? ''}
                onChange={(e) => setFilters({ date_from: e.target.value })}
              />
              <Input
                label="Дата по"
                type="date"
                value={filters.date_to ?? ''}
                onChange={(e) => setFilters({ date_to: e.target.value })}
              />
              <Select
                label="Статус"
                placeholder="Все статусы"
                value={filters.status ?? ''}
                onChange={(e) => setFilters({ status: e.target.value as AppointmentFilters['status'] })}
                options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: APPOINTMENT_STATUS_LABELS[s] }))}
              />
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              )}
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    view === 'list'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <LayoutList className="h-4 w-4" /> Список
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    view === 'calendar'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <CalendarDays className="h-4 w-4" /> Календарь
                </button>
              </div>
            </div>
          </div>

          {view === 'list' ? (
            <AppointmentsList
              appointments={appointments}
              loading={isLoading || (isFetching && !data)}
              onSelect={(a) => setSelectedId(a.id)}
              timeZone={clinicTimeZone}
            />
          ) : (
            <AppointmentsCalendar
              appointments={appointments}
              onSelect={(a) => setSelectedId(a.id)}
              onDayClick={(date) => openCreate(date)}
              dateFrom={filters.date_from}
              onRangeChange={(from, to) => setFilters({ date_from: from, date_to: to })}
              timeZone={clinicTimeZone}
            />
          )}
        </div>
      </Card>

      <AppointmentDetail appointmentId={selectedId} onClose={() => setSelectedId(null)} />
      <AppointmentFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaultDate={createDate} />
    </div>
  );
}
