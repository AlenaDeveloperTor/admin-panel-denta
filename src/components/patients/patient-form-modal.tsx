'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { userSchema, type UserFormValues } from '@/schemas/user';
import { useCreateUser, useUpdateUser } from '@/hooks/queries/useUsers';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/utils';
import type { User } from '@/types/user';

export function PatientFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  /** Если передан — режим редактирования */
  user?: User | null;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { first_name: '', last_name: '', patronymic: '', birth_date: '', phone: '', email: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        patronymic: user?.patronymic ?? '',
        birth_date: user?.birth_date ?? '',
        phone: user?.phone ?? '',
        email: user?.email ?? '',
      });
    }
  }, [open, user, reset]);

  const submitting = createUser.isPending || updateUser.isPending;

  const onSubmit = async (values: UserFormValues) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      patronymic: values.patronymic || undefined,
      birth_date: values.birth_date || undefined,
    };
    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, input: payload });
        toast.success('Пациент обновлён');
      } else {
        await createUser.mutateAsync(payload);
        toast.success('Пациент добавлен');
      }
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Редактировать пациента' : 'Добавить пациента'}
      description={user ? `ID пациента: ${user.id}` : 'Заполните данные нового пациента'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={submitting}>
            {user ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Фамилия *" placeholder="Иванов" error={errors.last_name?.message} {...register('last_name')} />
          <Input label="Имя *" placeholder="Иван" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Отчество" placeholder="Иванович" error={errors.patronymic?.message} {...register('patronymic')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Телефон *" placeholder="+7 999 123-45-67" error={errors.phone?.message} {...register('phone')} />
          <Input label="Дата рождения" type="date" error={errors.birth_date?.message} {...register('birth_date')} />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="patient@mail.ru"
          error={errors.email?.message}
          {...register('email')}
        />
      </form>
    </Modal>
  );
}
