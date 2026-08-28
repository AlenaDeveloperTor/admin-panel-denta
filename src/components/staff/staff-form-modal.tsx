'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { staffSchema, type StaffFormValues } from '@/schemas/staff';
import { useCreateStaff, useUpdateStaff } from '@/hooks/queries/useStaff';
import type { StaffMember } from '@/types/staff';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getErrorMessage } from '@/lib/utils';

/** Генерация временного пароля */
function generatePassword(len = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let p = '';
  for (let i = 0; i < len; i++) p += chars[arr[i] % chars.length];
  return p;
}

export function StaffFormModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  /** Если передан — редактирование */
  staff?: StaffMember | null;
}) {
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const submitting = createStaff.isPending || updateStaff.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', role: 'manager', password: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: staff?.name ?? '',
        email: staff?.email ?? '',
        role: staff?.role ?? 'manager',
        password: staff?.password ?? generatePassword(),
      });
    }
  }, [open, staff, reset]);

  const onSubmit = async (values: StaffFormValues) => {
    try {
      if (staff) {
        await updateStaff.mutateAsync({ id: staff.id, input: values });
        toast.success('Сотрудник обновлён');
      } else {
        await createStaff.mutateAsync(values);
        toast.success(`Сотрудник «${values.name}» создан`);
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
      title={staff ? 'Редактировать сотрудника' : 'Новый сотрудник'}
      description={staff ? `Учётная запись #${staff.id}` : 'Создайте учётную запись для сотрудника'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={submitting}>
            {staff ? 'Сохранить' : 'Создать'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="ФИО *" placeholder="Иванова Анна" error={errors.name?.message} {...register('name')} />
        <Input
          label="Email (логин) *"
          type="email"
          placeholder="manager@clinic.ru"
          error={errors.email?.message}
          {...register('email')}
        />
        <Select
          label="Роль *"
          {...register('role')}
          options={[
            { value: 'manager', label: 'Менеджер' },
            { value: 'admin', label: 'Администратор (полный доступ)' },
          ]}
        />
        <div className="flex items-end gap-2">
          <Input
            label="Временный пароль *"
            placeholder="••••••••"
            hint="Передайте пароль сотруднику. Хэшируется на бэкенде."
            error={errors.password?.message}
            {...register('password')}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
          >
            <KeyRound className="h-4 w-4" /> Сгенерировать
          </Button>
        </div>
      </form>
    </Modal>
  );
}
