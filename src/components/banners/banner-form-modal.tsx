'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { bannerSchema, type BannerFormValues } from '@/schemas/banner';
import { useCreateBanner, useUpdateBanner } from '@/hooks/queries/useBanners';
import { uploadImage } from '@/lib/api/upload';
import { getErrorMessage } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import type { Banner } from '@/types/banner';

export function BannerFormModal({ open, onClose, banner }: { open: boolean; onClose: () => void; banner?: Banner | null }) {
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { title: '', subtitle: '', image_url: '', button_text: '', bg_color: '#EAF4FF', is_active: true, sort_order: 0 },
  });

  useEffect(() => {
    if (open) reset({
      title: banner?.title ?? '', subtitle: banner?.subtitle ?? '', image_url: banner?.image_url ?? '',
      button_text: banner?.button_text ?? '', bg_color: banner?.bg_color ?? '#EAF4FF',
      is_active: banner?.is_active ?? true, sort_order: banner?.sort_order ?? 0,
    });
  }, [banner, open, reset]);

  const imageUrl = watch('image_url');
  const isActive = watch('is_active');
  const submitting = createBanner.isPending || updateBanner.isPending;

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      setValue('image_url', await uploadImage(file), { shouldValidate: true });
      toast.success('Изображение загружено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить изображение'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: BannerFormValues) => {
    try {
      if (banner) {
        await updateBanner.mutateAsync({ id: banner.id, input: values });
        toast.success('Баннер обновлён');
      } else {
        await createBanner.mutateAsync(values);
        toast.success('Баннер создан');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить баннер'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={banner ? 'Редактировать баннер' : 'Новый баннер'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Отмена</Button><Button onClick={handleSubmit(onSubmit)} loading={submitting}>Сохранить</Button></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Заголовок *" placeholder="Специальное предложение" error={errors.title?.message} {...register('title')} />
        <Textarea label="Подзаголовок" rows={2} placeholder="Краткое описание акции" error={errors.subtitle?.message} {...register('subtitle')} />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Изображение *</span>
          <Input
            placeholder="https://example.com/banner.jpg"
            hint="Укажите URL картинки или загрузите файл ниже"
            error={errors.image_url?.message}
            {...register('image_url')}
          />
          <ImageDropzone value={imageUrl} uploading={uploading} onChange={(url) => setValue('image_url', url, { shouldValidate: true })} onFile={handleImage} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Текст кнопки" placeholder="Подробнее" {...register('button_text')} />
          <Input label="Цвет фона" placeholder="#EAF4FF" error={errors.bg_color?.message} {...register('bg_color')} />
          <Input label="Порядок" type="number" min={0} error={errors.sort_order?.message} {...register('sort_order')} />
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
          <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">Баннер активен</p><p className="text-xs text-slate-400">Доступен для выбора в push-рассылке</p></div>
          <button type="button" role="switch" aria-checked={isActive} onClick={() => setValue('is_active', !isActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
        </label>
      </form>
    </Modal>
  );
}