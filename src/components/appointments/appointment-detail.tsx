'use client';

import { useState, type ReactNode } from 'react';
import { CalendarDays, Clock, MessageSquare, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointment, useUpdateAppointmentStatus } from '@/hooks/queries/useAppointments';
import { useSendPush } from '@/hooks/queries/usePush';
import { buildConfirmationPush } from '@/lib/push-message';
import { resolvePhoneToUserId } from '@/lib/push-resolve';
import { appointmentDate, appointmentTime } from '@/types/appointment';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PushModal } from '@/components/shared/push-modal';
import { fullName, formatPhone } from '@/types/user';
import type { AppointmentStatus } from '@/types/appointment';
import { formatDate, getErrorMessage } from '@/lib/utils';

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value}</div>
      </div>
    </div>
  );
}

export function AppointmentDetail({
  appointmentId,
  onClose,
}: {
  appointmentId: string | null;
  onClose: () => void;
}) {
  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const updateStatus = useUpdateAppointmentStatus();
  const sendPush = useSendPush();
  const [pushOpen, setPushOpen] = useState(false);
  const [notifyOnConfirm, setNotifyOnConfirm] = useState(true);

  const changeStatus = async (status: AppointmentStatus) => {
    if (!appointmentId) return;
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status });

      // Автоматическое уведомление клиента о подтверждении (по patient_ids)
      if (status === 'confirmed' && notifyOnConfirm && appointment) {
        let targetId = appointment.patient?.id ?? null;
        if (!targetId && phone) targetId = await resolvePhoneToUserId(phone);
        if (targetId) {
          try {
            const push = buildConfirmationPush(appointment);
            await sendPush.mutateAsync({
              target: 'users',
              patient_ids: [targetId],
              title: push.title,
              body: push.body,
              deep_link: push.deep_link,
            });
          } catch (pushError) {
            toast.warning('Запись подтверждена, но push не отправился', {
              description: getErrorMessage(pushError),
            });
          }
        }
      }

      toast.success('Статус записи обновлён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const patient = appointment?.patient;
  const phone = patient?.phone;

  return (
    <Modal
      open={Boolean(appointmentId)}
      onClose={onClose}
      title="Детали записи"
      description={appointment ? `Запись #${appointment.id}` : undefined}
      size="md"
      footer={
        appointment ? (
          <>
            {phone && (
              <Button variant="secondary" onClick={() => setPushOpen(true)}>
                <MessageSquare className="h-4 w-4" /> Написать пациенту
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'pending' && (
                <>
                  <Button onClick={() => changeStatus('confirmed')} loading={updateStatus.isPending}>
                    Подтвердить
                  </Button>
                  <Button variant="danger" onClick={() => changeStatus('cancelled')} loading={updateStatus.isPending}>
                    Отменить
                  </Button>
                </>
              )}
              {appointment.status === 'confirmed' && (
                <>
                  <Button onClick={() => changeStatus('completed')} loading={updateStatus.isPending}>
                    Завершить
                  </Button>
                  <Button variant="danger" onClick={() => changeStatus('cancelled')} loading={updateStatus.isPending}>
                    Отменить
                  </Button>
                </>
              )}
            </div>
          </>
        ) : null
      }
    >
      {isLoading || !appointment ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Статус</span>
            <StatusBadge status={appointment.status} />
          </div>
          <Row icon={<UserRound className="h-4 w-4" />} label="Пациент" value={fullName(patient)} />
          <Row
            icon={<Phone className="h-4 w-4" />}
            label="Телефон"
            value={formatPhone(phone)}
          />
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Услуга" value={appointment.service?.name ?? '—'} />
          <Row
            icon={<Clock className="h-4 w-4" />}
            label="Дата и время"
            value={
              appointment.appointment_datetime
                ? `${formatDate(appointmentDate(appointment) ?? '')} · ${appointmentTime(appointment)}`
                : 'Не назначено'
            }
          />
          {appointment.comment && (
            <Row
              icon={<MessageSquare className="h-4 w-4" />}
              label="Комментарий"
              value={<span className="whitespace-pre-wrap">{appointment.comment}</span>}
            />
          )}

          {appointment.status === 'pending' && (
            <label className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              <input
                type="checkbox"
                checked={notifyOnConfirm}
                onChange={(e) => setNotifyOnConfirm(e.target.checked)}
                disabled={!phone}
                className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600"
              />
              <span>
                Автоматически отправить клиенту push о подтверждении
                {!phone && <span className="ml-1 text-xs opacity-70">(нет телефона)</span>}
              </span>
            </label>
          )}
        </div>
      )}

      <PushModal
        open={pushOpen}
        onClose={() => setPushOpen(false)}
        phone={phone}
        patientName={patient ? fullName(patient) : undefined}
        userId={patient?.id}
      />
    </Modal>
  );
}
