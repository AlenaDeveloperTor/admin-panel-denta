'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  CalendarDays,
  Clock,
  Edit2,
  MessageSquare,
  Phone,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PushModal } from '@/components/shared/push-modal';
import { PatientCard } from '@/components/patients/patient-card';
import { useAppointment, useUpdateAppointment } from '@/hooks/queries/useAppointments';
import { useServices } from '@/hooks/queries/useServices';
import { useSendPush } from '@/hooks/queries/usePush';
import { buildConfirmationPush } from '@/lib/push-message';
import { resolvePhoneToUserId } from '@/lib/push-resolve';
import { appointmentDate, appointmentTime } from '@/types/appointment';
import { fullName, formatPhone } from '@/types/user';
import { formatDate, formatDateTime, getErrorMessage } from '@/lib/utils';

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

/**
 * Детали заявки на запись. Позволяет подтвердить/отменить заявку,
 * открыть карточку пациента и отправить push.
 */
export function RequestDetail({
  requestId,
  onClose,
  startEditing = false,
}: {
  requestId: string | null;
  onClose: () => void;
  startEditing?: boolean;
}) {
  const { data: request, isLoading } = useAppointment(requestId);
  const { data: services } = useServices();
  const updateAppointment = useUpdateAppointment();
  const sendPush = useSendPush();
  const [pushOpen, setPushOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [notifyOnConfirm, setNotifyOnConfirm] = useState(true);

  // Состояние формы редактирования заявки
  const [isEditing, setIsEditing] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const [comment, setComment] = useState('');

  // При открытии заявки заполняем поля
  useEffect(() => {
    if (request) {
      if (request.appointment_datetime) {
        const d = new Date(request.appointment_datetime);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDatetime(d.toISOString().slice(0, 16));
      } else {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDatetime(d.toISOString().slice(0, 16));
      }
      setServiceId(String(request.service?.id ?? request.service_id ?? ''));
      setComment(request.comment ?? '');
      setIsEditing(startEditing && request.status === 'created');
    }
  }, [request, startEditing]);

  const saveAndChangeStatus = async (status: 'confirmed' | 'cancelled') => {
    if (!requestId || !request) return;
    try {
      const payload: {
        status: 'confirmed' | 'cancelled';
        appointment_datetime?: string;
        service_id?: number;
        comment?: string;
      } = { status };

      if (status === 'confirmed') {
        if (datetime) {
          payload.appointment_datetime = new Date(datetime).toISOString();
        }
        if (serviceId) {
          payload.service_id = Number(serviceId);
        }
        if (comment !== undefined) {
          payload.comment = comment;
        }
      }

      await updateAppointment.mutateAsync({ id: requestId, data: payload });

      // Автоматическое уведомление клиента о подтверждении
      if (status === 'confirmed' && notifyOnConfirm) {
        let targetId = request.patient?.id ?? null;
        if (!targetId && phone) targetId = await resolvePhoneToUserId(phone);
        if (targetId) {
          try {
            const updatedReq = {
              ...request,
              appointment_datetime: payload.appointment_datetime ?? request.appointment_datetime,
              service: services?.find((s) => String(s.id) === String(serviceId)) ?? request.service,
            };
            const push = buildConfirmationPush(updatedReq);
            await sendPush.mutateAsync({
              target: 'users',
              patient_ids: [targetId],
              title: push.title,
              body: push.body,
            });
          } catch (pushError) {
            console.warn('Push error:', pushError);
          }
        }
      }

      toast.success(status === 'confirmed' ? 'Заявка подтверждена и перенесена в Записи' : 'Заявка отклонена');
      setIsEditing(false);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const patient = request?.patient;
  const phone = patient?.phone;

  return (
    <>
      <Modal
        open={Boolean(requestId)}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
        title="Заявка на запись"
        description={request ? `Заявка #${request.id} · создана ${formatDateTime(request.created_at)}` : undefined}
        size="md"
        footer={
          request ? (
            <>
              <div className="flex flex-wrap gap-2">
                {phone && (
                  <Button variant="secondary" onClick={() => setPushOpen(true)}>
                    <MessageSquare className="h-4 w-4" /> Написать пациенту
                  </Button>
                )}
                {patient && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setCardOpen(true)}
                    aria-label="Открыть карточку пациента"
                    title="Открыть карточку пациента"
                  >
                    <UserRound className="h-4 w-4" />
                  </Button>
                )}
                {request.status === 'created' && !isEditing && (
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" /> Редактировать
                  </Button>
                )}
              </div>
              {request.status === 'created' && (
                <div className="flex flex-wrap gap-2">
                  {isEditing && (
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Отмена
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => saveAndChangeStatus('cancelled')}
                    loading={updateAppointment.isPending}
                  >
                    Отклонить
                  </Button>
                  <Button
                    onClick={() => saveAndChangeStatus('confirmed')}
                    loading={updateAppointment.isPending}
                  >
                    Принять
                  </Button>
                </div>
              )}
            </>
          ) : null
        }
      >
        {isLoading || !request ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Статус</span>
              <StatusBadge status={request.status} />
            </div>
            <Row icon={<UserRound className="h-4 w-4" />} label="Пациент" value={fullName(patient)} />
            <Row icon={<Phone className="h-4 w-4" />} label="Телефон" value={formatPhone(phone)} />

            {/* Режим редактирования или просмотра */}
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
                  label="Комментарий администратора"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            ) : (
              <>
                <Row icon={<CalendarDays className="h-4 w-4" />} label="Услуга" value={request.service?.name ?? '—'} />
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label="Время визита"
                  value={
                    request.appointment_datetime
                      ? `${formatDate(appointmentDate(request) ?? '')} · ${appointmentTime(request)}`
                      : 'Не назначено'
                  }
                />
                {request.comment && (
                  <Row
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Комментарий клиента"
                    value={<span className="whitespace-pre-wrap">{request.comment}</span>}
                  />
                )}
              </>
            )}

            {request.status === 'created' && (
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
      </Modal>

      <PushModal
        open={pushOpen}
        onClose={() => setPushOpen(false)}
        phone={phone}
        patientName={patient ? fullName(patient) : undefined}
        userId={patient?.id}
      />
      <PatientCard userId={cardOpen ? patient?.id ?? null : null} onClose={() => setCardOpen(false)} />
    </>
  );
}
