'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { CalendarDays, Clock, Edit2, MessageSquare, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointment, useUpdateAppointment, useUpdateAppointmentStatus } from '@/hooks/queries/useAppointments';
import { useServices } from '@/hooks/queries/useServices';
import { useSendPush } from '@/hooks/queries/usePush';
import { buildConfirmationPush } from '@/lib/push-message';
import { resolvePhoneToUserId } from '@/lib/push-resolve';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PushModal } from '@/components/shared/push-modal';
import { fullName, formatPhone } from '@/types/user';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import { formatDateTimeInTimeZone, getErrorMessage } from '@/lib/utils';
import { settingsAPI } from '@/lib/api/settings';
import { useQuery } from '@tanstack/react-query';

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
  const { data: clinicSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((response) => response.data),
    retry: false,
  });
  const { data: services } = useServices();
  const updateStatus = useUpdateAppointmentStatus();
  const updateAppointment = useUpdateAppointment();
  const sendPush = useSendPush();
  const [pushOpen, setPushOpen] = useState(false);

  // Режим редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (appointment) {
      if (appointment.appointment_datetime) {
        const d = new Date(appointment.appointment_datetime);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDatetime(d.toISOString().slice(0, 16));
      } else {
        setDatetime('');
      }
      setServiceId(String(appointment.service?.id ?? appointment.service_id ?? ''));
      setComment(appointment.comment ?? '');
    }
  }, [appointment]);

  const saveChanges = async () => {
    if (!appointmentId || !appointment) return;
    try {
      const newDatetime = datetime ? new Date(datetime).toISOString() : undefined;
      await updateAppointment.mutateAsync({
        id: appointmentId,
        data: {
          appointment_datetime: newDatetime,
          service_id: serviceId ? Number(serviceId) : undefined,
          comment,
        },
      });

      // Если назначена или обновлена дата приёма — отправляем push-уведомление клиенту
      if (datetime) {
        const rawPhone = appointment.patient?.phone ?? (appointment as { phone?: string })?.phone;
        let targetId = appointment.patient?.id
          ?? appointment.user_id
          ?? (appointment as { patient_id?: number })?.patient_id
          ?? null;
        if (!targetId && rawPhone) {
          targetId = await resolvePhoneToUserId(rawPhone);
        }
        if (targetId) {
          try {
            const selectedService = services?.find((s) => String(s.id) === String(serviceId));
            const updatedAppointment: Appointment = {
              ...appointment,
              appointment_datetime: newDatetime,
              service: selectedService ?? appointment.service,
            };
            const push = buildConfirmationPush(
              updatedAppointment,
              clinicSettings?.timezone ?? 'Europe/Moscow',
            );
            await sendPush.mutateAsync({
              target: 'users',
              patient_ids: [Number(targetId)],
              title: push.title,
              body: push.body,
              deep_link: 'app://appointments',
            });
            toast.success('Запись обновлена, пациенту отправлен push с датой визита');
          } catch (pushErr) {
            console.warn('[push] Ошибка отправки пуша:', pushErr);
            toast.success('Запись обновлена (пуш отправить не удалось)');
          }
        } else {
          toast.success('Запись обновлена');
        }
      } else {
        toast.success('Запись обновлена');
      }

      setIsEditing(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const changeStatus = async (status: AppointmentStatus) => {
    if (!appointmentId) return;
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status });
      toast.success('Статус записи обновлён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const patient = appointment?.patient;
  const phone = patient?.phone ?? (appointment as { phone?: string })?.phone;

  return (
    <Modal
      open={Boolean(appointmentId)}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
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
            {!isEditing && (
              <Button
                variant={!appointment.appointment_datetime ? 'primary' : 'secondary'}
                onClick={() => setIsEditing(true)}
              >
                {!appointment.appointment_datetime ? (
                  <>
                    <CalendarDays className="h-4 w-4" /> Назначить дату
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" /> Редактировать
                  </>
                )}
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
                <Button onClick={saveChanges} loading={updateAppointment.isPending}>
                  Сохранить изменения
                </Button>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'created' && (
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
          {!appointment.appointment_datetime && appointment.status === 'confirmed' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Время визита ещё не назначено
                </p>
                <p className="text-amber-800/90 dark:text-amber-300">
                  Свяжитесь с клиентом по телефону {formatPhone(phone)}, согласуйте дату визита и нажмите «Назначить дату». После сохранения запись будет полностью оформлена.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Статус</span>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={appointment.status} />
              {!appointment.appointment_datetime && appointment.status === 'confirmed' && (
                <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  Ждёт звонка
                </span>
              )}
            </div>
          </div>
          <Row icon={<UserRound className="h-4 w-4" />} label="Пациент" value={fullName(patient)} />
          <Row
            icon={<Phone className="h-4 w-4" />}
            label="Телефон"
            value={formatPhone(phone)}
          />

          {isEditing ? (
            <div className="space-y-3 py-3">
              <Select
                label="Услуга *"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                options={
                  (services ?? [])
                    .filter((s) => s.is_active)
                    .map((s) => ({ value: s.id, label: `${s.name} · ${s.price} ₽` })) ?? []
                }
              />
              <Input
                label="Дата и время визита *"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
              <Textarea
                label="Комментарий"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          ) : (
            <>
              <Row icon={<CalendarDays className="h-4 w-4" />} label="Услуга" value={appointment.service?.name ?? '—'} />
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Дата и время"
                value={
                  appointment.appointment_datetime ? (
                    formatDateTimeInTimeZone(
                      appointment.appointment_datetime,
                      clinicSettings?.timezone ?? 'Europe/Moscow',
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                      Не назначено · Требуется звонок
                    </span>
                  )
                }
              />
              {appointment.comment && (
                <Row
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Комментарий"
                  value={<span className="whitespace-pre-wrap">{appointment.comment}</span>}
                />
              )}
            </>
          )}

          {appointment.status === 'created' && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              <span>При подтверждении клиенту автоматически отправляется push-уведомление</span>
            </div>
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
