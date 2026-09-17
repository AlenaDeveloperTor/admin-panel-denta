import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** brand = голубой labsmile акцент, warm = бежевый тёплый, остальные — семантические */
type Tone = 'slate' | 'brand' | 'warm' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';

const tones: Record<Tone, string> = {
  brand:  'bg-[#eef4fb] text-[#172933] dark:bg-[#aac6ee]/20 dark:text-[#aac6ee]',
  warm:   'bg-[#f5f2ed] text-[#172933] dark:bg-[#d0c8b5]/20 dark:text-[#d0c8b5]',
  slate:  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  emerald:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  rose:   'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  sky:    'bg-[#eef4fb] text-[#172933] dark:bg-[#aac6ee]/20 dark:text-[#aac6ee]',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

export function Badge({
  tone = 'slate',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
