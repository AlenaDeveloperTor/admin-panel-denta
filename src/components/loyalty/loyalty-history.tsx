'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useLoyaltyHistory } from '@/hooks/queries/useLoyalty';
import type { LoyaltyTransaction } from '@/types/loyalty';
import { formatDateTime, formatNumber, cn } from '@/lib/utils';

function HistoryRow({ tx }: { tx: LoyaltyTransaction }) {
  const positive = tx.amount > 0;
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-sm font-semibold',
              positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {positive ? '+' : ''}
            {formatNumber(tx.amount)} баллов
          </span>
          {tx.source === 'manual' ? <Badge tone="sky">вручную</Badge> : <Badge tone="slate">авто</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{tx.reason}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {tx.user_name ? `${tx.user_name} · ` : ''}
          {tx.phone ?? ''}
        </p>
      </div>
      <span className="shrink-0 text-xs text-slate-400">{formatDateTime(tx.created_at)}</span>
    </div>
  );
}

/**
 * История начислений и списаний по пациентам.
 * Поиск по телефону (debounce 500мс) → GET /admin/loyalty/history?phone=...
 */
const PAGE_SIZE = 20;

export function LoyaltyHistory() {
  const [phone, setPhone] = useState('');
  const debouncedPhone = useDebounce(phone, 500);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useLoyaltyHistory({
    phone: debouncedPhone.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const history = data?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="История операций"
        subtitle="Начисления и списания баллов по пациентам"
      />
      <CardContent className="space-y-4">
        <SearchInput
          value={phone}
          onChange={setPhone}
          placeholder="Поиск по телефону пациента…"
          className="max-w-sm"
        />
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !debouncedPhone.trim() ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              Введите телефон пациента, чтобы увидеть его операции с баллами
            </p>
          </div>
        ) : history.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            По этому телефону операций не найдено
          </p>
        ) : (
          <>
            <div className={cn('divide-y divide-slate-100 dark:divide-slate-800', isFetching && 'opacity-60')}>
              {history.map((tx) => (
                <HistoryRow key={String(tx.id)} tx={tx} />
              ))}
            </div>
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
              total={data?.total}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
