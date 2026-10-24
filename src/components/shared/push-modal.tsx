'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Eye, Loader2, MessageSquare, Send, UserCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { PushPreview } from '@/components/push/push-preview';
import { pushAPI } from '@/lib/api/push';
import { uploadImage } from '@/lib/api/upload';
import { resolvePhoneToUserId } from '@/lib/push-resolve';
import { cn, getErrorMessage } from '@/lib/utils';

const pushModalSchema = z.object({
  category: z.enum(['promo', 'system', 'info']).default('system'),
  title: z.string().min(3, 'Заголовок — минимум 3 символа').max(80, 'Заголовок — максимум 80 символов'),
  body: z.string().min(3, 'Текст — минимум 3 символа').max(500, 'Текст — максимум 500 символов'),
  image_url: z.string().optional().or(z.literal('')),
});

type PushModalFormValues = z.infer<typeof pushModalSchema>;

type ImageMode = 'url' | 'file';
type MobileTab = 'form' | 'preview';

/**
 * Адаптивное модальное окно персональной отправки push-уведомления пациенту.
 * - На десктопе (md+): двухколоночная раскладка (форма слева, аккуратный превью справа)
 * - На мобильных: переключатель вкладок «Сообщение» / «Предпросмотр», чтобы не перегружать экран
 * - Поддерживает прикрепление изображения по ссылке (URL) и загрузкой с компьютера
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
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [activeTab, setActiveTab] = useState<MobileTab>('form');
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PushModalFormValues>({
    resolver: zodResolver(pushModalSchema),
    defaultValues: { category: 'system', title: '', body: '', image_url: '' },
  });

  const formValues = watch();

  useEffect(() => {
    if (open) {
      reset({ category: 'system', title: '', body: '', image_url: '' });
      setImageMode('url');
      setPendingFile(null);
      setPreviewUrl(undefined);
      setActiveTab('form');
    }
  }, [open, reset]);

  const close = () => {
    reset({ category: 'system', title: '', body: '', image_url: '' });
    setImageMode('url');
    setPendingFile(null);
    setPreviewUrl(undefined);
    setActiveTab('form');
    onClose();
  };

  const switchImageMode = (mode: ImageMode) => {
    setImageMode(mode);
    setPendingFile(null);
    setPreviewUrl(undefined);
    setValue('image_url', '');
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (values: PushModalFormValues) => {
    setSending(true);
    try {
      let patientId = userId ?? null;
      if (!patientId && phone) {
        patientId = await resolvePhoneToUserId(phone);
      }
      if (!patientId) {
        toast.error('Пациент не найден в базе. Push доступен только зарегистрированным клиентам.');
        return;
      }

      let finalImageUrl = values.image_url?.trim() || undefined;

      if (imageMode === 'file' && pendingFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadImage(pendingFile, 'banners');
        } catch (uploadErr) {
          toast.error(getErrorMessage(uploadErr, 'Не удалось загрузить изображение'));
          return;
        } finally {
          setUploading(false);
        }
      }

      await pushAPI.send({
        title: values.title.trim(),
        body: values.body.trim(),
        image_url: finalImageUrl,
        patient_ids: [patientId],
      });

      queryClient.invalidateQueries({ queryKey: ['push', 'history'] });

      toast.success(
        patientName
          ? `Push-уведомление отправлено клиенту ${patientName}`
          : 'Персональное push-уведомление отправлено',
      );
      close();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось отправить уведомление'));
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const displayImageUrl =
    imageMode === 'file' ? previewUrl || formValues.image_url : formValues.image_url;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Персональное Push-уведомление"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={close} type="button">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={sending || uploading}
            type="button"
          >
            {sending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Отправить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Компактная строка с информацией о получателе */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex min-w-0 items-center gap-2">
            <UserCheck className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
              {patientName || (userId ? `Пациент #${userId}` : 'Клиент клиники')}
            </span>
            {phone && <span className="text-slate-500 dark:text-slate-400">· {phone}</span>}
            {userId && (
              <Badge tone="slate" className="py-0 text-[10px]">
                ID: {userId}
              </Badge>
            )}
          </div>
          <Badge tone="sky" className="py-0 text-[10px]">
            Персонально
          </Badge>
        </div>

        {/* Переключатель вкладок только для мобильных экранов (< md) */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 md:hidden dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
              activeTab === 'form'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Сообщение
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
              activeTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Предпросмотр
          </button>
        </div>

        {/* Сетка: Форма (7 колонок) + Превью (5 колонок) */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Левая часть: Форма ввода */}
          <div
            className={cn(
              'space-y-3.5 md:col-span-7',
              activeTab === 'preview' ? 'hidden md:block' : 'block',
            )}
          >
            {/* Тип + Заголовок в одной компактной строке */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Select
                  label="Тип"
                  options={[
                    { value: 'system', label: 'Обычное' },
                    { value: 'promo', label: 'Акция' },
                    { value: 'info', label: 'Информация' },
                  ]}
                  {...register('category')}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Заголовок *"
                  placeholder="Например: Напоминание о записи"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>
            </div>

            {/* Текст уведомления */}
            <div>
              <Textarea
                label="Текст уведомления *"
                placeholder="Текст, который увидит клиент на экране телефона…"
                rows={3}
                error={errors.body?.message}
                {...register('body')}
              />
            </div>

            {/* Блок изображения с компактным переключателем в заголовке */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Изображение{' '}
                  <span className="text-xs font-normal text-slate-400">(опционально)</span>
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => switchImageMode('url')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      imageMode === 'url'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                    )}
                  >
                    По URL
                  </button>
                  <button
                    type="button"
                    onClick={() => switchImageMode('file')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      imageMode === 'file'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                    )}
                  >
                    Загрузить файл
                  </button>
                </div>
              </div>

              {imageMode === 'url' ? (
                <Input
                  placeholder="https://…/banner.jpg"
                  hint="Вставьте прямую ссылку на изображение"
                  error={errors.image_url?.message}
                  {...register('image_url')}
                />
              ) : (
                <div className="space-y-1">
                  <ImageDropzone
                    value={previewUrl}
                    uploading={uploading}
                    className="h-28"
                    onChange={(url) => {
                      setPreviewUrl(url);
                      setPendingFile(null);
                      setValue('image_url', '');
                    }}
                    onFile={handleFileSelect}
                  />
                  {pendingFile && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ✓ Файл выбран и будет автоматически загружен на сервер при отправке
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Правая часть: Предпросмотр */}
          <div
            className={cn(
              'flex flex-col items-center justify-start rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 md:col-span-5 dark:border-slate-800 dark:bg-slate-900/30',
              activeTab === 'form' ? 'hidden md:flex' : 'flex',
            )}
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Предпросмотр на телефоне
              </span>
              <span className="text-[10px] text-slate-400">iOS / Android</span>
            </div>
            <div className="flex w-full justify-center">
              <PushPreview
                title={formValues.title}
                body={formValues.body}
                imageUrl={displayImageUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
