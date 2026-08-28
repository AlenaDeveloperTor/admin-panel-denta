'use client';

import { Info } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoyaltyHistory } from '@/components/loyalty/loyalty-history';

export default function LoyaltyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Программа лояльности"
        subtitle="Ручное начисление и списание баллов, история операций"
      />
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Лояльность работает вручную: менеджер завершает запись и начисляет баллы в карточке пациента
          (кнопка «Баллы»). Проценты начисления/списания задаются в «Настройках» и служат подсказкой.
        </p>
      </div>
      <LoyaltyHistory />
    </div>
  );
}
