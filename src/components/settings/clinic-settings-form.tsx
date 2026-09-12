'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsSchema, type SettingsFormValues } from '@/schemas/settings';
import { settingsAPI } from '@/lib/api/settings';
import type { ClinicSettings } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export function ClinicSettingsForm() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((r) => r.data),
    retry: false,
  });

  const save = useMutation({
    mutationFn: (input: Partial<ClinicSettings>) => settingsAPI.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      phone: '',
      timezone: 'Europe/Moscow',
      email: '',
      address: '',
      work_hours: '',
      about: '',
      accrual_percent: '',
      write_off_percent: '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name ?? '',
        phone: settings.phone ?? '',
        timezone: settings.timezone ?? 'Europe/Moscow',
        email: settings.email ?? '',
        address: settings.address ?? '',
        work_hours: settings.work_hours ?? '',
        about: settings.about ?? '',
        accrual_percent: settings.accrual_percent ?? '',
        write_off_percent: settings.write_off_percent ?? '',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await save.mutateAsync({
        name: values.name,
        phone: values.phone,
        timezone: values.timezone,
        email: values.email || undefined,
        address: values.address || undefined,
        work_hours: values.work_hours || undefined,
        about: values.about || undefined,
        accrual_percent: values.accrual_percent === '' ? undefined : Number(values.accrual_percent),
        write_off_percent: values.write_off_percent === '' ? undefined : Number(values.write_off_percent),
      });
      toast.success('Настройки сохранены');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader title="Данные клиники" subtitle="Отображаются в мобильном приложении" />
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Название клиники *" error={errors.name?.message} {...register('name')} />
              <Input label="Телефон *" error={errors.phone?.message} {...register('phone')} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Адрес" error={errors.address?.message} {...register('address')} />
            </div>
            <Input label="Часы работы" placeholder="Пн–Сб 9:00–20:00" error={errors.work_hours?.message} {...register('work_hours')} />
            <Select
              label="Часовой пояс клиники *"
              error={errors.timezone?.message}
              {...register('timezone')}
              options={[
                { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
                { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
                { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
                { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
                { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
                { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
                { value: 'Asia/Barnaul', label: 'Барнаул (UTC+7)' },
                { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
                { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
                { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
                { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
                { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
                { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Начисление баллов, %"
                type="number"
                min={0}
                max={100}
                hint="% от стоимости услуги (справочно для менеджера)"
                error={errors.accrual_percent?.message}
                {...register('accrual_percent')}
              />
              <Input
                label="Покрытие баллами, %"
                type="number"
                min={0}
                max={100}
                hint="% стоимости, который можно оплатить баллами"
                error={errors.write_off_percent?.message}
                {...register('write_off_percent')}
              />
            </div>
            <Textarea label="О клинике" rows={4} error={errors.about?.message} {...register('about')} />
            <div className="flex justify-end">
              <Button type="submit" loading={save.isPending}>
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
