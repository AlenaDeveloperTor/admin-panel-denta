'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { appointmentSchema, type AppointmentFormValues } from '@/schemas/appointment';
import { useCreateAppointment } from '@/hooks/queries/useAppointments';
import { appointmentsAPI } from '@/lib/api/appointments';
import { useServices } from '@/hooks/queries/useServices';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSelect, type PatientOption } from './patient-select';
import { pushAPI } from '@/lib/api/push';
import { buildCreationPush } from '@/lib/push-message';
import { getErrorMessage } from '@/lib/utils';
import { clinicDatetimeToUTC } from '@/lib/utils';
import { settingsAPI } from '@/lib/api/settings';
import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '@/types/appointment';

/** Приводит "YYYY-MM-DD" (из календаря) к datetime-local "YYYY-MM-DDTHH:mm" */
function toDatetimeLocal(date?: string): string {
  if (date) return `${date}T10:00`;
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function AppointmentFormModal({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}) {
  const createAppointment = useCreateAppointment();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: clinicSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((response) => response.data),
    retry: false,
  });
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [patientError, setPatientError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_datetime: toDatetimeLocal(defaultDate),
      comment: '',
    },
  });

  const serviceId = watch('service_id');

  /** Отправляем push пациенту (fire-and-forget: не блокируем при ошибке) */
  async function sendCreationPush(appointment: Appointment) {
    if (!patient?.id) return;
    try {
      const msg = buildCreationPush(appointment, clinicSettings?.timezone ?? 'Europe/Moscow');
      await pushAPI.send({
        title: msg.title,
        body: msg.body,
        patient_ids: [patient.id],
      });
      console.log('[push] Уведомление о записи отправлено пациенту', patient.id);
    } catch (err) {
      // Запись уже создана — ошибка пуша не критична
      console.warn('[push] Не удалось отправить уведомление о записи:', err);
      toast.warning('Запись создана, но уведомление не отправлено', { duration: 4000 });
    }
  }

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!patient) {
      setPatientError('Выберите пациента');
      return;
    }
    setPatientError('');
    try {
      const appointmentDatetime = clinicDatetimeToUTC(
        values.appointment_datetime,
        clinicSettings?.timezone ?? 'Europe/Moscow',
      );
      const res = await createAppointment.mutateAsync({
        user_id: patient!.id,
        service_id: values.service_id,
        appointment_datetime: appointmentDatetime,
        comment: values.comment || undefined,
      });

      const createdItem = res.data;
      const createdId = createdItem?.id;

      // Сразу подтверждаем запись, созданную админом, чтобы она была в Записях, а не Заявках
      if (createdId) {
        try {
          await appointmentsAPI.updateStatus(String(createdId), 'confirmed');
        } catch (statusErr) {
          console.warn('[appointments] Не удалось перевести статус в confirmed:', statusErr);
        }
      }

      // Строим объект Appointment для генерации текста пуша
      const selectedService = services?.find((s) => s.id === values.service_id);
      const appointmentForPush: Appointment = {
        ...(createdItem ?? {}),
        id: (createdItem as Appointment)?.id ?? '',
        service_id: values.service_id,
        service: selectedService ?? null,
        status: 'confirmed',
        appointment_datetime: appointmentDatetime,
        patient: {
          id: patient.id,
          first_name: patient.name.split(' ')[1] ?? patient.name.split(' ')[0] ?? '',
          last_name: patient.name.split(' ')[0] ?? '',
          phone: patient.phone,
          loyalty_balance: 0,
        },
      };

      // Отправляем пуш параллельно с закрытием формы
      void sendCreationPush(appointmentForPush);

      toast.success('Запись создана, уведомление отправлено');
      close();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const close = () => {
    reset({ appointment_datetime: toDatetimeLocal(defaultDate), comment: '' });
    setPatient(null);
    setPatientError('');
    onClose();
  };

  const patientName = patient ? `${patient.name} · ${patient.phone}` : 'Не выбран';

  return (
    <Modal
      open={open}
      onClose={close}
      title="Создать запись"
      description={`Пациент: ${patientName}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Отмена
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createAppointment.isPending}>
            Создать запись
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Пациент *
          </span>
          <PatientSelect
            value={patient}
            onChange={(p) => {
              setPatient(p);
              if (p) setPatientError('');
            }}
          />
          {patientError && (
            <p className="mt-1 text-xs text-rose-500">{patientError}</p>
          )}
        </div>

        <Select
          label="Услуга *"
          placeholder={servicesLoading ? 'Загрузка…' : 'Выберите услугу'}
          value={serviceId ?? ''}
          onChange={(e) => setValue('service_id', e.target.value, { shouldValidate: true })}
          error={errors.service_id?.message}
          options={
            (services ?? [])
              .filter((s) => s.is_active)
              .map((s) => ({ value: s.id, label: `${s.name} · ${s.price} ₽` })) ?? []
          }
        />

        <Input
          label="Дата и время *"
          type="datetime-local"
          error={errors.appointment_datetime?.message}
          {...register('appointment_datetime')}
        />

        <Textarea
          label="Комментарий"
          placeholder="Комментарий к записи…"
          rows={3}
          error={errors.comment?.message}
          {...register('comment')}
        />
      </form>
    </Modal>
  );
}
