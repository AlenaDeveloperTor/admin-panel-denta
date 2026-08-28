'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { pushAPI } from '@/lib/api/push';
import { resolvePhoneToUserId } from '@/lib/push-resolve';
import { getErrorMessage } from '@/lib/utils';

const pushSchema = z.object({
  title: z.string().min(3, 'Заголовок — минимум 3 символа'),
  body: z.string().min(3, 'Текст — минимум 3 символа'),
  deep_link: z.string().optional().or(z.literal('')),
});

type PushFormValues = z.infer<typeof pushSchema>;

/**
 * Отправка push-уведомления пациенту (кнопка «Написать пациенту»).
 * По контракту бэкенда вызывает POST /admin/push/send с patient_ids.
 * Если передан userId — используем его; иначе ищем пользователя по телефону.
 */
export function PushModal({
  open,
  onClose,
  phone,
  patientName,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  phone?: string;
  patientName?: string;
  userId?: number;
}) {
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PushFormValues>({
    resolver: zodResolver(pushSchema),
    defaultValues: { title: '', body: '', deep_link: 'app://appointments' },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: PushFormValues) => {
    setSending(true);
    try {
      let patientId = userId ?? null;
      if (!patientId && phone) {
        patientId = await resolvePhoneToUserId(phone);
      }
      if (!patientId) {
        toast.error('Пациент не найден. Push доступен только зарегистрированным клиентам.');
        return;
      }
      await pushAPI.send({
        title: values.title,
        body: values.body,
        deep_link: values.deep_link,
        patient_ids: [patientId],
      });
      toast.success('Уведомление отправлено');
      close();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось отправить уведомление'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Push-уведомление"
      description={patientName ? `Получатель: ${patientName} · ${phone}` : `Получатель: ${phone}`}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Отмена
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={sending}>
            Отправить
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="push-form">
        <Input label="Заголовок *" placeholder="Например: Напоминание о записи" error={errors.title?.message} {...register('title')} />
        <Textarea label="Текст *" placeholder="Текст уведомления…" rows={4} error={errors.body?.message} {...register('body')} />
        <Input label="Deep link" placeholder="app://appointments" hint="Куда откроется приложение при тапе" error={errors.deep_link?.message} {...register('deep_link')} />
      </form>
    </Modal>
  );
}
