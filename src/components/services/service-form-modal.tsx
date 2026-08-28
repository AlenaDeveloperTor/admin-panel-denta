'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { serviceSchema, type ServiceFormValues } from '@/schemas/service';
import { useCreateService, useUpdateService } from '@/hooks/queries/useServices';
import { uploadImage } from '@/lib/api/upload';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { DURATION_OPTIONS } from '@/types/service';
import type { Service } from '@/types/service';
import { getErrorMessage } from '@/lib/utils';

export function ServiceFormModal({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
}) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 60,
      image_url: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        price: service?.price ?? 0,
        duration: service?.duration ?? 60,
        image_url: service?.image_url ?? '',
        is_active: service?.is_active ?? true,
      });
    }
  }, [open, service, reset]);

  const imageUrl = watch('image_url');
  const isActive = watch('is_active');
  const submitting = createService.isPending || updateService.isPending;

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setValue('image_url', url);
      toast.success('Изображение загружено');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось загрузить изображение'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      if (service) {
        await updateService.mutateAsync({ id: service.id, input: values });
        toast.success('Услуга обновлена');
      } else {
        await createService.mutateAsync(values);
        toast.success('Услуга добавлена');
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
      title={service ? 'Редактировать услугу' : 'Добавить услугу'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={submitting}>
            Сохранить
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Название *" placeholder="Лечение кариеса" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Описание"
          placeholder="Краткое описание услуги…"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Цена, ₽ *"
            type="number"
            min={1}
            step={50}
            placeholder="5000"
            error={errors.price?.message}
            {...register('price')}
          />
          <Select
            label="Длительность *"
            value={String(watch('duration'))}
            onChange={(e) => setValue('duration', Number(e.target.value))}
            options={DURATION_OPTIONS.map((d) => ({
              value: String(d),
              label: d >= 60 ? `${Math.floor(d / 60)} ч${d % 60 ? ` ${d % 60} мин` : ''}` : `${d} мин`,
            }))}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Изображение (для баннера на главной)
          </span>
          <ImageDropzone
            value={imageUrl}
            uploading={uploading}
            onChange={(url) => setValue('image_url', url)}
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Услуга активна</p>
            <p className="text-xs text-slate-400">Показывается в мобильном приложении</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue('is_active', !isActive)}
            className={cnSwitch(isActive)}
          >
            <span
              className={cnKnob(isActive)}
            />
          </button>
        </label>
      </form>
    </Modal>
  );
}

function cnSwitch(on: boolean): string {
  return `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
    on ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
  }`;
}
function cnKnob(on: boolean): string {
  return `inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
    on ? 'translate-x-6' : 'translate-x-1'
  }`;
}
