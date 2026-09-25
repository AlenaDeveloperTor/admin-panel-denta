'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCreateBanner, useUpdateBanner } from '@/hooks/queries/useBanners';
import { uploadImage } from '@/lib/api/upload';
import { getErrorMessage } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Banner, CreateBannerInput } from '@/types/banner';

type ImageMode = 'url' | 'file';

const EMPTY: CreateBannerInput = {
  title: '',
  subtitle: '',
  image_url: '',
  button_text: '',
  button_url: undefined,
  bg_color: '#EAF4FF',
  is_active: true,
  sort_order: 0,
};

export function BannerFormModal({ open, onClose, banner }: { open: boolean; onClose: () => void; banner?: Banner | null }) {
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  const [form, setForm] = useState<CreateBannerInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateBannerInput | 'image', string>>>({});

  useEffect(() => {
    if (open) {
      setImageMode('url');
      setPendingFile(null);
      setPreviewUrl(undefined);
      setErrors({});
      setForm(
        banner
          ? {
              title: banner.title ?? '',
              subtitle: banner.subtitle ?? '',
              image_url: banner.image_url ?? '',
              button_text: banner.button_text ?? '',
              button_url: banner.button_url,
              bg_color: banner.bg_color ?? '#EAF4FF',
              is_active: banner.is_active ?? true,
              sort_order: banner.sort_order ?? 0,
            }
          : EMPTY
      );
    }
  }, [banner, open]);

  const set = <K extends keyof CreateBannerInput>(key: K, value: CreateBannerInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const switchMode = (mode: ImageMode) => {
    setImageMode(mode);
    setPendingFile(null);
    setPreviewUrl(undefined);
    setErrors((e) => ({ ...e, image: undefined }));
    set('image_url', '');
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setErrors((e) => ({ ...e, image: undefined }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Укажите заголовок';
    if (form.title.length > 120) errs.title = 'Максимум 120 символов';
    if (form.subtitle.length > 240) errs.subtitle = 'Максимум 240 символов';
    if (imageMode === 'url' && !form.image_url.trim()) errs.image = 'Укажите URL изображения';
    if (imageMode === 'file' && !pendingFile) errs.image = 'Выберите файл изображения';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.bg_color)) errs.bg_color = 'Формат #RRGGBB';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitting = createBanner.isPending || updateBanner.isPending || uploading;

  const handleSave = async () => {
    console.log('[BannerForm] handleSave clicked');

    // Диагностика токена
    const token = useAuthStore.getState().accessToken;
    console.log('[BannerForm] accessToken:', token ? `${token.slice(0, 20)}...` : 'НЕТ!');

    if (!validate()) {
      console.log('[BannerForm] валидация не прошла, errors:', errors);
      return;
    }

    let imageUrl = form.image_url;

    if (imageMode === 'file' && pendingFile) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(pendingFile);
        console.log('[BannerForm] файл загружен:', imageUrl);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Не удалось загрузить изображение'));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const input: CreateBannerInput = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image_url: imageUrl.trim(),
      button_text: form.button_text.trim(),
      button_url: form.button_url?.trim() || undefined,
      bg_color: form.bg_color,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

    console.log('[BannerForm] отправляем на бэк:', input);

    try {
      if (banner) {
        await updateBanner.mutateAsync({ id: banner.id, input });
        toast.success('Баннер обновлён');
      } else {
        await createBanner.mutateAsync(input);
        toast.success('Баннер создан');
      }
      onClose();
    } catch (error) {
      console.error('[BannerForm] ошибка сохранения:', error);
      toast.error(getErrorMessage(error, 'Не удалось сохранить баннер'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={banner ? 'Редактировать баннер' : 'Новый баннер'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} loading={submitting}>Сохранить</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Заголовок */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Заголовок *</label>
          <Input
            placeholder="Специальное предложение"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            error={errors.title}
          />
        </div>

        {/* Подзаголовок */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Подзаголовок</label>
          <Textarea
            rows={2}
            placeholder="Краткое описание акции"
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            error={errors.subtitle}
          />
        </div>

        {/* Изображение */}
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Изображение *</span>
          <div className="mb-3 flex rounded-lg border border-slate-200 p-1 dark:border-slate-700" style={{ width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => switchMode('url')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                imageMode === 'url'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              По URL
            </button>
            <button
              type="button"
              onClick={() => switchMode('file')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                imageMode === 'file'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Загрузить файл
            </button>
          </div>

          {imageMode === 'url' ? (
            <Input
              placeholder="https://example.com/banner.jpg"
              hint="Вставьте прямую ссылку на изображение"
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              error={errors.image}
            />
          ) : (
            <>
              <ImageDropzone
                value={previewUrl}
                uploading={uploading}
                onChange={(url) => { setPreviewUrl(url); setErrors((e) => ({ ...e, image: undefined })); }}
                onFile={handleFileSelect}
              />
              {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
              {pendingFile && !errors.image && (
                <p className="mt-1 text-xs text-slate-500">Файл будет загружен при сохранении</p>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Текст кнопки</label>
            <Input placeholder="Подробнее" value={form.button_text} onChange={(e) => set('button_text', e.target.value)} error={errors.button_text} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Ссылка кнопки</label>
            <Input placeholder="https://example.com" value={form.button_url ?? ''} onChange={(e) => set('button_url', e.target.value || undefined)} error={errors.button_url} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Цвет фона</label>
            <Input placeholder="#EAF4FF" value={form.bg_color} onChange={(e) => set('bg_color', e.target.value)} error={errors.bg_color} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Порядок</label>
            <Input type="number" min={0} value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} error={errors.sort_order} />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Баннер активен</p>
            <p className="text-xs text-slate-400">Доступен для выбора в push-рассылке</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_active}
            onClick={() => set('is_active', !form.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.is_active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.is_active ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>
      </div>
    </Modal>
  );
}
