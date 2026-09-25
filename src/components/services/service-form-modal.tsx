'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

interface ServiceFormValues {
  name: string;
  description: string;
  price: number;
  duration: number;
  image_url: string;
  is_active: boolean;
}

const EMPTY: ServiceFormValues = {
  name: '',
  description: '',
  price: 0,
  duration: 60,
  image_url: '',
  is_active: true,
};

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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<ServiceFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormValues | 'image', string>>>({});

  useEffect(() => {
    if (open) {
      setPendingFile(null);
      setErrors({});
      setForm(
        service
          ? {
              name: service.name ?? '',
              description: service.description ?? '',
              price: service.price ?? 0,
              duration: service.duration ?? 60,
              image_url: service.image_url ?? '',
              is_active: service.is_active ?? true,
            }
          : EMPTY
      );
      setPreviewUrl(service?.image_url || undefined);
    }
  }, [open, service]);

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setErrors((e) => ({ ...e, image: undefined }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Укажите название';
    if (form.name.length > 200) errs.name = 'Максимум 200 символов';
    if (Number(form.price) <= 0) errs.price = 'Цена должна быть больше 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitting = createService.isPending || updateService.isPending || uploading;

  const handleSave = async () => {
    console.log('[ServiceForm] handleSave clicked');
    if (!validate()) return;

    let imageUrl = form.image_url;

    // Если выбран локальный файл — сначала загружаем на POST /admin/upload?folder=services
    if (pendingFile) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(pendingFile, 'services');
        console.log('[ServiceForm] файл загружен:', imageUrl);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Не удалось загрузить изображение'));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      image_url: imageUrl.trim(),
      is_active: form.is_active,
    };

    console.log('[ServiceForm] отправляем на бэк:', input);

    try {
      if (service) {
        await updateService.mutateAsync({ id: service.id, input });
        toast.success('Услуга обновлена');
      } else {
        await createService.mutateAsync(input);
        toast.success('Услуга добавлена');
      }
      onClose();
    } catch (error) {
      console.error('[ServiceForm] ошибка сохранения:', error);
      toast.error(getErrorMessage(error, 'Не удалось сохранить услугу'));
    }
  };

  const durationLabel = (d: number) =>
    d >= 60
      ? `${Math.floor(d / 60)} ч${d % 60 ? ` ${d % 60} мин` : ''}`
      : `${d} мин`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? 'Редактировать услугу' : 'Добавить услугу'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} loading={submitting}>Сохранить</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Название */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Название *</label>
          <Input
            placeholder="Лечение кариеса"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
        </div>

        {/* Описание */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Описание</label>
          <Textarea
            placeholder="Краткое описание услуги…"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            error={errors.description}
          />
        </div>

        {/* Цена и длительность */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Цена, ₽ *</label>
            <Input
              type="number"
              min={1}
              step={50}
              placeholder="5000"
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              error={errors.price}
            />
          </div>
          <Select
            label="Длительность *"
            value={String(form.duration)}
            onChange={(e) => set('duration', Number(e.target.value))}
            options={DURATION_OPTIONS.map((d) => ({ value: String(d), label: durationLabel(d) }))}
          />
        </div>

        {/* Изображение */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Изображение (для баннера на главной)
          </span>
          <ImageDropzone
            value={previewUrl}
            uploading={uploading}
            onChange={(url) => {
              setPreviewUrl(url);
              set('image_url', url);
            }}
            onFile={handleFileSelect}
          />
          {pendingFile && !errors.image && (
            <p className="mt-1 text-xs text-slate-500">Файл будет загружен при сохранении</p>
          )}
          {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
        </div>

        {/* Активность */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Услуга активна</p>
            <p className="text-xs text-slate-400">Показывается в мобильном приложении</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_active}
            onClick={() => set('is_active', !form.is_active)}
            className={cnSwitch(form.is_active)}
          >
            <span className={cnKnob(form.is_active)} />
          </button>
        </label>
      </div>
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
