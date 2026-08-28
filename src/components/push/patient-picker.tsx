'use client';

import { useMemo, useState } from 'react';
import { Check, Search, UserRound, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers } from '@/hooks/queries/useUsers';
import { fullName, formatPhone } from '@/types/user';
import type { User } from '@/types/user';
import { cn } from '@/lib/utils';

/**
 * Поиск и выбор пациентов для адресной рассылки.
 * Передаёт выбранных пациентов наверх через onChange.
 */
export function PatientPicker({
  selected,
  onChange,
}: {
  selected: User[];
  onChange: (users: User[]) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [open, setOpen] = useState(false);

  const { data } = useUsers({
    page: 1,
    limit: 20,
    search: debounced.trim() || undefined,
  });

  const results = useMemo(() => {
    const list = data?.items ?? [];
    // Исключаем уже выбранных
    const selectedIds = new Set(selected.map((u) => u.id));
    return list.filter((u) => !selectedIds.has(u.id));
  }, [data, selected]);

  const toggle = (user: User) => {
    const exists = selected.some((u) => u.id === user.id);
    onChange(exists ? selected.filter((u) => u.id !== user.id) : [...selected, user]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Поиск по ФИО или телефону…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {open && results.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                toggle(user);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-800 dark:text-slate-200">{fullName(user)}</p>
                <p className="text-xs text-slate-400">{formatPhone(user.phone)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
            >
              <Check className="h-3 w-3" />
              {fullName(user)}
              <button
                type="button"
                onClick={() => toggle(user)}
                className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-800"
                aria-label={`Убрать ${fullName(user)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
