'use client';

import { useMemo } from 'react';
import { CalendarDays, Check, Phone, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useRequestsStore } from '@/stores/useRequestsStore';
import { useUpdateAppointmentStatus } from '@/hooks/queries/useAppointments';
import { appointmentDate, appointmentTime } from '@/types/appointment';
import type { Appointment } from '@/types/appointment';
import { fullName, formatPhone } from '@/types/user';
import { formatDate, formatDateTime, getErrorMessage } from '@/lib/utils';

/**
 * Список новых заявок на запись (статус pending).
 * Новые (непросмотренные) подсвечиваются.
 */
export function RequestsList({
  requests,
  loading,
  onSelect,
}: {
  requests: Appointment[];
  loading: boolean;
  onSelect: (request: Appointment) => void;
}) {
  const updateStatus = useUpdateAppointmentStatus();
  const seenIds = useRequestsStore((s) => s.seenIds);
  const seen = useMemo(() => new Set(seenIds), [seenIds]);

  const quickAction = async (request: Appointment, status: 'confirmed' | 'cancelled') => {
    try {
      await updateStatus.mutateAsync({ id: request.id, status });
      toast.success(status === 'confirmed' ? 'Заявка подтверждена' : 'Заявка отклонена');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Новых заявок нет"
          description="Когда клиент оставит заявку через приложение, она появится здесь"
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {requests.map((request) => {
        const isNew = !seen.has(String(request.id));
        const name = fullName(request.patient);
        return (
          <Card
            key={String(request.id)}
            className={isNew ? 'border-brand-300 ring-1 ring-brand-200 dark:border-brand-700' : ''}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button className="min-w-0 text-left" onClick={() => onSelect(request)}>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                    {isNew && <Badge tone="sky">новое</Badge>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Phone className="h-3 w-3" /> {formatPhone(request.patient?.phone)}
                  </p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    onClick={() => quickAction(request, 'confirmed')}
                    aria-label="Подтвердить"
                    loading={updateStatus.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    onClick={() => quickAction(request, 'cancelled')}
                    aria-label="Отклонить"
                    loading={updateStatus.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <button className="mt-3 w-full text-left" onClick={() => onSelect(request)}>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-900/30">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{request.service?.name ?? 'Услуга'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {request.appointment_datetime
                      ? `${formatDate(appointmentDate(request) ?? '')} · ${appointmentTime(request)}`
                      : 'Время не назначено'}
                  </span>
                  <span>{formatDateTime(request.created_at)}</span>
                </div>
                {request.comment && (
                  <p className="mt-2 line-clamp-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    «{request.comment}»
                  </p>
                )}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
