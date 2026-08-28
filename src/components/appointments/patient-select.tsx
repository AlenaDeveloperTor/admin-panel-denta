'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers } from '@/hooks/queries/useUsers';
import { fullName } from '@/types/user';
import { cn } from '@/lib/utils';

export interface PatientOption {
  id: number;
  name: string;
  phone: string;
}

export function PatientSelect({
  value,
  onChange,
}: {
  value: PatientOption | null;
  onChange: (patient: PatientOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useUsers({
    page: 1,
    limit: 10,
    search: debounced || undefined,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = data?.items ?? [];

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/30">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{value.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{value.phone}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1 text-slate-400 hover:bg-brand-100 hover:text-slate-600 dark:hover:bg-brand-900/40"
          aria-label="Убрать пациента"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск пациента по телефону или ФИО…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {isFetching ? (
            <p className="px-3 py-3 text-sm text-slate-400">Поиск…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-400">Пациенты не найдены. Проверьте ввод.</p>
          ) : (
            results.map((p) => {
              const name = fullName(p);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    onChange({ id: p.id, name, phone: p.phone });
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  <Check className="h-4 w-4 text-transparent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-200">{name}</span>
                    <span className="block text-xs text-slate-400">{p.phone}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
