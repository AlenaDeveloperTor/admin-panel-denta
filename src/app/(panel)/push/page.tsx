'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Calendar,
  FileSpreadsheet,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { PushPreview } from '@/components/push/push-preview';
import { PushHistory } from '@/components/push/push-history';
import { PushSendProgress } from '@/components/push/push-send-progress';
import { PatientPicker } from '@/components/push/patient-picker';
import { BirthYearFilter } from '@/components/push/birth-year-filter';
import { IdentImport } from '@/components/push/ident-import';
import { pushSchema, type PushFormValues, isValidPushPhone, normalizePushPhone } from '@/schemas/push';
import { useSendPush } from '@/hooks/queries/usePush';
import { useAllPatients } from '@/hooks/queries/useUsers';
import { uploadImage } from '@/lib/api/upload';
import { getPushDrafts, savePushDraft, deletePushDraft } from '@/lib/push-drafts';
import { resolvePhonesToUserIds } from '@/lib/push-resolve';
import type { PushDraft, PushTarget } from '@/types/push';
import type { User } from '@/types/user';
import { cn, formatDateTime, getErrorMessage } from '@/lib/utils';

const TARGET_OPTIONS: {
  value: PushTarget;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    value: 'all',
    title: 'Все пациенты',
    description: 'Массовая рассылка по всем пользователям приложения',
  },
  {
    value: 'birth_year',
    title: 'По году рождения',
    description: 'Фильтр по году или возрасту (например, ортодонтия)',
    badge: 'Новинка',
  },
  {
    value: 'ident_import',
    title: 'Список из IDENT',
    description: 'Выгрузка из IDENT (вставка списка или файл Excel/CSV)',
    badge: 'Новинка',
  },
  {
    value: 'users',
    title: 'Выбрать вручную',
    description: 'Точечный поиск по картотеке пациентов',
  },
  {
    value: 'phones',
    title: 'По телефону',
    description: 'Ручной ввод номеров телефонов',
  },
];

export default function PushPage() {
  const sendPush = useSendPush();
  const { data: allPatients = [], isLoading: isLoadingAllPatients } = useAllPatients();

  const [target, setTarget] = useState<PushTarget>('all');
  const [phones, setPhones] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [patients, setPatients] = useState<User[]>([]);
  const [drafts, setDrafts] = useState<PushDraft[]>(() => getPushDrafts());
  const [taskId, setTaskId] = useState<string | null>(null);

  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PushFormValues>({
    resolver: zodResolver(pushSchema),
    defaultValues: { category: 'system', title: '', body: '', image_url: '' },
  });

  const formValues = watch();

  const switchImageMode = (mode: 'url' | 'file') => {
    setImageMode(mode);
    setPendingFile(null);
    setPreviewUrl(undefined);
    setValue('image_url', '');
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const recipientCount =
    target === 'all'
      ? allPatients.length > 0
        ? allPatients.length
        : undefined
      : target === 'phones'
        ? phones.length
        : patients.length;

  const canSend =
    target === 'all' ||
    (target === 'phones' && phones.length > 0) ||
    ((target === 'users' || target === 'birth_year' || target === 'ident_import') && patients.length > 0);

  const addPhone = () => {
    const raw = phoneInput.trim();
    if (!raw) return;
    if (!isValidPushPhone(raw)) {
      toast.error('Некорректный номер телефона');
      return;
    }
    const normalized = normalizePushPhone(raw);
    if (phones.includes(normalized)) {
      toast.info('Этот номер уже добавлен');
      return;
    }
    setPhones((prev) => [...prev, normalized]);
    setPhoneInput('');
  };

  const addBulkPhones = (text: string) => {
    const list = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return;
    const added: string[] = [];
    const skipped: string[] = [];
    list.forEach((p) => {
      if (!isValidPushPhone(p)) {
        skipped.push(p);
        return;
      }
      const normalized = normalizePushPhone(p);
      if (!phones.includes(normalized)) {
        added.push(normalized);
      }
    });
    if (added.length) setPhones((prev) => [...prev, ...added]);
    if (skipped.length) toast.error(`Некорректные номера: ${skipped.join(', ')}`);
  };

  const handleSaveDraft = () => {
    const values = getValues();
    const draft: PushDraft = {
      id: crypto.randomUUID(),
      category: values.category,
      title: values.title,
      body: values.body,
      image_url: values.image_url ?? '',
      target,
      phones,
      patient_ids: patients.map((p) => p.id),
      saved_at: new Date().toISOString(),
    };
    setDrafts(savePushDraft(draft));
    toast.success('Черновик сохранён');
  };

  const loadDraft = (draft: PushDraft) => {
    reset({
      category: draft.category ?? 'system',
      title: draft.title,
      body: draft.body,
      image_url: draft.image_url || '',
    });
    setImageMode('url');
    setPendingFile(null);
    setPreviewUrl(undefined);
    setTarget(draft.target);
    setPhones(draft.phones || []);
    // Сопоставляем сохранённые id с загруженными пациентами
    const patientMap = new Map(allPatients.map((p) => [p.id, p]));
    setPatients(
      (draft.patient_ids || []).map(
        (id) =>
          patientMap.get(id) || {
            id,
            phone: '',
            first_name: '',
            last_name: `Пациент #${id}`,
            loyalty_balance: 0,
          },
      ),
    );
    toast.success('Черновик загружен');
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(deletePushDraft(id));
    toast.success('Черновик удалён');
  };

  const onSubmit = async (values: PushFormValues) => {
    if (!canSend) {
      if (target === 'phones') {
        toast.error('Добавьте хотя бы один телефон');
      } else if (target === 'birth_year') {
        toast.error('Выберите хотя бы одного пациента по фильтру года рождения');
      } else if (target === 'ident_import') {
        toast.error('Загрузите список из IDENT и выберите получателей');
      } else {
        toast.error('Выберите хотя бы одного пациента');
      }
      return;
    }
    try {
      let imageUrl = values.image_url?.trim() || undefined;

      if (imageMode === 'file' && pendingFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(pendingFile, 'banners');
        } catch (err) {
          toast.error(getErrorMessage(err, 'Не удалось загрузить изображение'));
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Приводим аудиторию к patient_ids (по контракту бэкенда: send-all или send)
      let patientIds: number[] = [];
      if (target === 'users' || target === 'birth_year' || target === 'ident_import') {
        patientIds = patients.map((p) => p.id);
      } else if (target === 'phones') {
        const resolved = await resolvePhonesToUserIds(phones);
        patientIds = resolved.ids;
        if (resolved.missing.length) {
          toast.warning(`Не найдены пациенты: ${resolved.missing.join(', ')}`);
        }
        if (patientIds.length === 0) {
          toast.error('Ни один из телефонов не найден среди пациентов');
          return;
        }
      }

      const res = await sendPush.mutateAsync({
        category: values.category,
        title: values.title,
        body: values.body,
        image_url: imageUrl,
        target: target === 'all' ? 'all' : 'users',
        patient_ids: patientIds,
      });
      const newTaskId = res.data?.task_id ?? null;
      if (newTaskId) {
        setTaskId(newTaskId);
      } else {
        const msg =
          target === 'birth_year'
            ? `Рассылка отправлена (${patientIds.length} по фильтру года рождения)`
            : target === 'ident_import'
              ? `Рассылка отправлена (${patientIds.length} из IDENT)`
              : 'Рассылка отправлена';
        toast.success(msg);
      }
      reset({ category: 'system', title: '', body: '', image_url: '' });
      setPendingFile(null);
      setPreviewUrl(undefined);
      setImageMode('url');
      setPhones([]);
      setPatients([]);
      setTarget('all');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось отправить рассылку'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Push-рассылка"
        subtitle="Индивидуальные и массовые уведомления клиентам клиники"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Форма */}
        <Card className="lg:col-span-2">
          <CardHeader title="Составление уведомления" subtitle="Подготовьте и отправьте push клиентам" />
          <CardContent className="space-y-5">
            {/* Получатели */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Получатели</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTarget(opt.value)}
                    className={cn(
                      'relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all',
                      target === opt.value
                        ? 'border-brand-500 bg-brand-50/80 shadow-sm dark:border-brand-600 dark:bg-brand-900/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800',
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.title}</p>
                        {opt.badge && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      {target === opt.value && recipientCount != null && (
                        <Badge tone="sky" className="text-xs">
                          <Users className="h-3 w-3" /> {recipientCount}
                        </Badge>
                      )}
                      {opt.value === 'all' && allPatients.length > 0 && target === 'all' && (
                        <Badge tone="slate" className="text-[11px]">
                          {allPatients.length} в базе
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Фильтр по году рождения */}
            {target === 'birth_year' && (
              <BirthYearFilter
                patients={allPatients}
                selected={patients}
                onChange={setPatients}
                isLoading={isLoadingAllPatients}
              />
            )}

            {/* Выгрузка из IDENT */}
            {target === 'ident_import' && (
              <IdentImport
                allPatients={allPatients}
                selected={patients}
                onChange={setPatients}
                isLoadingPatients={isLoadingAllPatients}
              />
            )}

            {/* По номерам телефонов */}
            {target === 'phones' && (
              <div className="space-y-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPhone();
                      }
                    }}
                    placeholder="+7 999 123-45-67"
                  />
                  <Button type="button" variant="secondary" onClick={addPhone}>
                    Добавить
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Или вставьте список телефонов — по одному в строке"
                  onBlur={(e) => {
                    addBulkPhones(e.target.value);
                    e.target.value = '';
                  }}
                />
                {phones.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {phones.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {p}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-500"
                          onClick={() => setPhones((prev) => prev.filter((x) => x !== p))}
                          aria-label={`Убрать ${p}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Выбор из картотеки */}
            {target === 'users' && <PatientPicker selected={patients} onChange={setPatients} />}

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <Select
              label="Тип уведомления"
              options={[
                { value: 'system', label: 'Обычное уведомление' },
                { value: 'promo', label: 'Акция' },
                { value: 'info', label: 'Информация' },
              ]}
              {...register('category')}
            />
            <Input
              label="Заголовок *"
              placeholder="Например: Напоминание о приёме"
              error={errors.title?.message}
              {...register('title')}
            />
            <Textarea
              label="Текст *"
              placeholder="Текст уведомления…"
              rows={4}
              error={errors.body?.message}
              {...register('body')}
            />
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Изображение <span className="text-xs font-normal text-slate-400">(опционально)</span>
              </span>
              <div
                className="mb-3 flex rounded-lg border border-slate-200 p-1 dark:border-slate-700"
                style={{ width: 'fit-content' }}
              >
                <button
                  type="button"
                  onClick={() => switchImageMode('url')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                    imageMode === 'url'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                  )}
                >
                  По URL
                </button>
                <button
                  type="button"
                  onClick={() => switchImageMode('file')}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                    imageMode === 'file'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                  )}
                >
                  Загрузить файл
                </button>
              </div>

              {imageMode === 'url' ? (
                <Input
                  placeholder="https://…/banner.jpg"
                  hint="Вставьте прямую ссылку на изображение"
                  error={errors.image_url?.message}
                  {...register('image_url')}
                />
              ) : (
                <>
                  <ImageDropzone
                    value={previewUrl}
                    uploading={uploading}
                    onChange={(url) => {
                      setPreviewUrl(url);
                      setPendingFile(null);
                      setValue('image_url', '');
                    }}
                    onFile={handleFileSelect}
                  />
                  {pendingFile && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Файл будет загружен при отправке рассылки
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleSaveDraft} type="button">
                <Save className="h-4 w-4" /> Сохранить черновик
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={sendPush.isPending || uploading}
                disabled={!canSend}
              >
                {sendPush.isPending || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Отправить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Превью + черновики */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Предпросмотр" subtitle="Так уведомление увидит клиент" />
            <CardContent>
              <PushPreview
                title={formValues.title}
                body={formValues.body}
                imageUrl={imageMode === 'file' ? (previewUrl || formValues.image_url) : formValues.image_url}
              />
            </CardContent>
          </Card>

          {drafts.length > 0 && (
            <Card>
              <CardHeader title="Черновики" subtitle="Подготовленные, но не отправленные" />
              <CardContent className="space-y-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                  >
                    <button type="button" className="min-w-0 text-left" onClick={() => loadDraft(draft)}>
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{draft.title || 'Без заголовка'}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(draft.saved_at)} ·{' '}
                        {draft.target === 'all'
                          ? 'всем'
                          : draft.target === 'phones'
                            ? `${draft.phones.length} тел.`
                            : draft.target === 'birth_year'
                              ? `${draft.patient_ids.length} по г.р.`
                              : draft.target === 'ident_import'
                                ? `${draft.patient_ids.length} из IDENT`
                                : `${draft.patient_ids.length} пациентов`}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30"
                      aria-label="Удалить черновик"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PushHistory />
      <PushSendProgress taskId={taskId} onClose={() => setTaskId(null)} />
    </div>
  );
}
