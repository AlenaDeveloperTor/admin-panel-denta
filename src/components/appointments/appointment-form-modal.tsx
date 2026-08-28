'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { appointmentSchema, type AppointmentFormValues } from '@/schemas/appointment';
import { useCreateAppointment } from '@/hooks/queries/useAppointments';
import { useServices } from '@/hooks/queries/useServices';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSelect, type PatientOption } from './patient-select';
import { getErrorMessage } from '@/lib/utils';

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
    defaultValues: { appointment_datetime: toDatetimeLocal(defaultDate), comment: '' },
  });

  const serviceId = watch('service_id');

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!patient) {
      setPatientError('Выберите пациента');
      return;
    }
    setPatientError('');
    try {
      await createAppointment.mutateAsync({
        user_id: patient.id,
        service_id: values.service_id,
        appointment_datetime: new Date(values.appointment_datetime).toISOString(),
        comment: values.comment || undefined,
      });
      toast.success('Запись создана');
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
          <PatientSelect value={patient} onChange={(p) => setPatient(p)} />
          {(patientError || errors.user_id) && (
            <p className="mt-1 text-xs text-rose-500">{patientError || errors.user_id?.message}</p>
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
