'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Coins, Plus, Minus } from 'lucide-react';
import { adjustPointsSchema, type AdjustPointsFormValues } from '@/schemas/loyalty';
import { useAdjustLoyaltyBalance } from '@/hooks/queries/useLoyalty';
import { settingsAPI } from '@/lib/api/settings';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fullName } from '@/types/user';
import type { User } from '@/types/user';
import { formatNumber, getErrorMessage } from '@/lib/utils';

const QUICK_AMOUNTS = [50, 100, 200, 500];

/**
 * Модалка ручного начисления/списания баллов пациенту.
 * amount > 0 — начисление, amount < 0 — списание.
 * POST /admin/loyalty/transactions
 */
export function AdjustPointsModal({
  open,
  onClose,
  patient,
}: {
  open: boolean;
  onClose: () => void;
  patient: User | null;
}) {
  const adjust = useAdjustLoyaltyBalance();
  const [mode, setMode] = useState<'accrue' | 'writeOff'>('accrue');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((r) => r.data),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdjustPointsFormValues>({
    resolver: zodResolver(adjustPointsSchema),
    defaultValues: { amount: undefined, reason: '' },
  });

  useEffect(() => {
    if (open) {
      setMode('accrue');
      reset({ amount: undefined, reason: '' });
    }
  }, [open, reset]);

  const amount = watch('amount');

  const applyQuick = (value: number) => {
    const signed = mode === 'accrue' ? Math.abs(value) : -Math.abs(value);
    setValue('amount', signed, { shouldValidate: true });
  };

  const onSubmit = async (values: AdjustPointsFormValues) => {
    if (!patient) return;
    try {
      const signed = mode === 'accrue' ? Math.abs(values.amount) : -Math.abs(values.amount);
      await adjust.mutateAsync({
        user_id: patient.id,
        amount: signed,
        reason: values.reason,
      });
      toast.success(
        signed > 0
          ? `Начислено ${formatNumber(signed)} баллов`
          : `Списано ${formatNumber(Math.abs(signed))} баллов`,
      );
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Баллы лояльности"
      description={patient ? `${fullName(patient)} · ${patient.phone ?? ''}` : 'Выберите пациента'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={adjust.isPending}
            variant={mode === 'writeOff' ? 'danger' : 'primary'}
          >
            {mode === 'accrue' ? 'Начислить' : 'Списать'}
          </Button>
        </>
      }
    >
      <form id="adjust-points-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
          <span className="text-sm text-slate-500 dark:text-slate-400">Текущий баланс</span>
          <span className="flex items-center gap-1.5 text-lg font-bold text-brand-600 dark:text-brand-400">
            <Coins className="h-5 w-5" />
            {formatNumber(patient?.loyalty_balance)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('accrue')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              mode === 'accrue'
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="h-4 w-4" /> Начисление
          </button>
          <button
            type="button"
            onClick={() => setMode('writeOff')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              mode === 'writeOff'
                ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            <Minus className="h-4 w-4" /> Списание
          </button>
        </div>

        {settings && (
          <p className="text-xs text-slate-400">
            Подсказка: начисление — {settings.accrual_percent ?? 0}% от стоимости услуги, списание — до{' '}
            {settings.write_off_percent ?? 0}% (проценты из «Настроек»).
          </p>
        )}

        <Input
          label="Количество баллов *"
          type="number"
          placeholder="Например: 100"
          hint={mode === 'accrue' ? 'Баллы будут добавлены к балансу' : 'Баллы будут списаны с баланса'}
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Быстро:</span>
          {QUICK_AMOUNTS.map((q) => (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuick(q)}
              className={mode === 'writeOff' ? 'text-rose-600' : 'text-brand-600'}
            >
              {mode === 'writeOff' ? '−' : '+'}
              {q}
            </Button>
          ))}
          {amount != null && amount !== 0 && (
            <span className="text-xs text-slate-400">
              Итог: {amount > 0 ? '+' : ''}
              {formatNumber(amount)}
            </span>
          )}
        </div>

        <Textarea
          label="Причина *"
          placeholder="Например: бонус за отзыв, компенсация, акция «Приведи друга»"
          rows={2}
          error={errors.reason?.message}
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
