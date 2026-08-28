import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
};

export function KpiCard({
  label,
  value,
  icon,
  tone = 'emerald',
  hint,
  loading,
  linkTo,
}: {
  label: string;
  value?: number | string;
  icon: ReactNode;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
  /** Если задан — карточка становится ссылкой */
  linkTo?: string;
}) {
  const inner = (
    <Card className={cn('p-5', linkTo && 'transition-colors hover:border-brand-300 dark:hover:border-brand-700')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {value ?? '—'}
            </p>
          )}
          {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          {icon}
        </div>
      </div>
    </Card>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
