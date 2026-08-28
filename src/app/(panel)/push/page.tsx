'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, Send, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PushPreview } from '@/components/push/push-preview';
import { PushHistory } from '@/components/push/push-history';
import { PushSendProgress } from '@/components/push/push-send-progress';
import { PatientPicker } from '@/components/push/patient-picker';
import { pushSchema, type PushFormValues, isValidPushPhone, normalizePushPhone } from '@/schemas/push';
import { useSendPush } from '@/hooks/queries/usePush';
import { getPushDrafts, savePushDraft, deletePushDraft } from '@/lib/push-drafts';
import { resolvePhonesToUserIds } from '@/lib/push-resolve';
import type { PushDraft, PushTarget } from '@/types/push';
import type { User } from '@/types/user';
import { cn, formatDateTime, getErrorMessage } from '@/lib/utils';

const TARGET_OPTIONS: { value: PushTarget; title: string; description: string }[] = [
  { value: 'all', title: 'Все пациенты', description: 'Рассылка по всем пользователям приложения' },
  { value: 'users', title: 'Выбрать пациентов', description: 'Точечная рассылка по картотеке' },
  { value: 'phones', title: 'По телефону', description: 'Введите телефоны — найдём пациентов по базе' },
];

export default function PushPage() {
  const sendPush = useSendPush();
  const [target, setTarget] = useState<PushTarget>('all');
  const [phones, setPhones] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [patients, setPatients] = useState<User[]>([]);
  const [drafts, setDrafts] = useState<PushDraft[]>(() => getPushDrafts());
  const [taskId, setTaskId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PushFormValues>({
    resolver: zodResolver(pushSchema),
    defaultValues: { title: '', body: '', deep_link: 'app://appointments', image_url: '' },
  });

  const formValues = watch();

  const recipientCount = target === 'all' ? undefined : target === 'phones' ? phones.length : patients.length;
  const canSend =
    target === 'all' ||
    (target === 'phones' && phones.length > 0) ||
    (target === 'users' && patients.length > 0);

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
      title: values.title,
      body: values.body,
      deep_link: values.deep_link ?? '',
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
      title: draft.title,
      body: draft.body,
      deep_link: draft.deep_link,
      image_url: draft.image_url || '',
    });
    setTarget(draft.target);
    setPhones(draft.phones);
    // Имена выбранных пациентов восстановить нельзя без запроса — сохраняем только id,
    // отобразим их как «Пациент #id»
    setPatients(
      draft.patient_ids.map((id) => ({
        id,
        phone: '',
        first_name: '',
        last_name: `Пациент #${id}`,
        loyalty_balance: 0,
      })),
    );
    toast.success('Черновик загружен');
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(deletePushDraft(id));
    toast.success('Черновик удалён');
  };

  const onSubmit = async (values: PushFormValues) => {
    if (!canSend) {
      toast.error(target === 'phones' ? 'Добавьте хотя бы один телефон' : 'Выберите хотя бы одного пациента');
      return;
    }
    try {
      // Приводим аудиторию к patient_ids (по контракту: send-all или send)
      let patientIds: number[] = [];
      if (target === 'users') {
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
        title: values.title,
        body: values.body,
        deep_link: values.deep_link,
        image_url: values.image_url,
        target: target === 'all' ? 'all' : 'users',
        patient_ids: patientIds,
      });
      const newTaskId = res.data?.task_id ?? null;
      if (newTaskId) {
        setTaskId(newTaskId);
      } else {
        toast.success('Рассылка отправлена');
      }
      reset({ title: '', body: '', deep_link: 'app://appointments', image_url: '' });
      setPhones([]);
      setPatients([]);
      setTarget('all');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось отправить рассылку'));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Push-рассылка"
        subtitle="Индивидуальные и массовые уведомления клиентам"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Форма */}
        <Card className="lg:col-span-2">
          <CardHeader title="Составление уведомления" subtitle="Подготовьте и отправьте push клиентам" />
          <CardContent className="space-y-5">
            {/* Получатели */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Получатели</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTarget(opt.value)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      target === opt.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                    {target === opt.value && recipientCount != null && (
                      <Badge tone="sky" className="mt-2">
                        <Users className="h-3 w-3" /> {recipientCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

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

            {target === 'users' && <PatientPicker selected={patients} onChange={setPatients} />}

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Deep link"
                placeholder="app://appointments"
                hint="Куда откроется приложение при тапе"
                error={errors.deep_link?.message}
                {...register('deep_link')}
              />
              <Input
                label="Изображение (URL)"
                placeholder="https://…/banner.jpg"
                hint="Опционально, для акций"
                error={errors.image_url?.message}
                {...register('image_url')}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleSaveDraft} type="button">
                <Save className="h-4 w-4" /> Сохранить черновик
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={sendPush.isPending}
                disabled={!canSend}
              >
                {sendPush.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                imageUrl={formValues.image_url}
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
