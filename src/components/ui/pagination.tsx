'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      {total !== undefined && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Всего: <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-1 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(Number(p))}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Следующая страница"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getPageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}
