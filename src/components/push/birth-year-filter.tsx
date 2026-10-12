'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  Filter,
  Search,
  Sparkles,
  Square,
  UserRound,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fullName, formatPhone, type User } from '@/types/user';
import {
  parseBirthYear,
  calculateAge,
  pluralizeYears,
  formatBirthInfo,
  getDentalAgePresets,
  type YearPreset,
} from '@/lib/birth-date';
import { cn, formatNumber } from '@/lib/utils';

export interface BirthYearFilterProps {
  patients: User[];
  selected: User[];
  onChange: (selected: User[]) => void;
  isLoading?: boolean;
}

export function BirthYearFilter({
  patients,
  selected,
  onChange,
  isLoading,
}: BirthYearFilterProps) {
  const currentYear = new Date().getFullYear();
  const presets = useMemo(() => getDentalAgePresets(), []);

  // Режим: 'range' (диапазон годов), 'age' (по возрасту в годах), 'exact' (точный год)
  const [mode, setMode] = useState<'range' | 'age' | 'exact'>('range');
  const [activePreset, setActivePreset] = useState<string | null>('ortho');

  // Дефолтно преднастроено на ортодонтию (12–30 лет, т.е. ~текущий год - 30 ... текущий год - 12)
  const [yearFrom, setYearFrom] = useState<number>(currentYear - 30);
  const [yearTo, setYearTo] = useState<number>(currentYear - 12);
  const [exactYear, setExactYear] = useState<number>(2005);
  const [ageFrom, setAgeFrom] = useState<number>(12);
  const [ageTo, setAgeTo] = useState<number>(30);

  const [search, setSearch] = useState('');

  // Применение пресета
  const applyPreset = (preset: YearPreset) => {
    setActivePreset(preset.id);
    setMode('age');
    setAgeFrom(preset.ageFrom);
    setAgeTo(preset.ageTo);

    const calculatedYearFrom = currentYear - preset.ageTo;
    const calculatedYearTo = currentYear - preset.ageFrom;
    setYearFrom(calculatedYearFrom);
    setYearTo(calculatedYearTo);
  };

  // Пациенты с датой рождения и без
  const { withBirthDate, withoutBirthDate } = useMemo(() => {
    const withBd: { user: User; year: number; age: number | null }[] = [];
    const withoutBd: User[] = [];

    for (const u of patients) {
      const y = parseBirthYear(u.birth_date);
      if (y) {
        withBd.push({ user: u, year: y, age: calculateAge(y) });
      } else {
        withoutBd.push(u);
      }
    }

    return { withBirthDate: withBd, withoutBirthDate: withoutBd };
  }, [patients]);

  // Фильтрация по критериям
  const matchedPatients = useMemo(() => {
    return withBirthDate
      .filter((item) => {
        if (mode === 'exact') {
          return item.year === exactYear;
        }
        if (mode === 'age') {
          if (item.age == null) return false;
          return item.age >= ageFrom && item.age <= ageTo;
        }
        // mode === 'range'
        return item.year >= yearFrom && item.year <= yearTo;
      })
      .map((item) => item.user);
  }, [withBirthDate, mode, exactYear, ageFrom, ageTo, yearFrom, yearTo]);

  // Поиск по ФИО и телефону среди найденных
  const displayedPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matchedPatients;
    return matchedPatients.filter((u) => {
      const name = fullName(u).toLowerCase();
      const phone = (u.phone || '').replace(/\D/g, '');
      return name.includes(q) || phone.includes(q.replace(/\D/g, ''));
    });
  }, [matchedPatients, search]);

  // Первоначальный выбор всех подходящих пациентов при изменении фильтра
  useEffect(() => {
    if (matchedPatients.length > 0) {
      onChange(matchedPatients);
    }
  }, [matchedPatients, onChange]);

  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);

  const toggleUser = (user: User) => {
    if (selectedIds.has(user.id)) {
      onChange(selected.filter((u) => u.id !== user.id));
    } else {
      onChange([...selected, user]);
    }
  };

  const selectAll = () => {
    onChange(matchedPatients);
  };

  const deselectAll = () => {
    onChange([]);
  };

  const isAllSelected = matchedPatients.length > 0 && selected.length === matchedPatients.length;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Заголовок фильтра */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Фильтр по году рождения и возрасту
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Сегментация базы для целевых предложений (ортодонтия, детский приём и др.)
            </p>
          </div>
        </div>

        {/* Переключатель режимов */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('range');
              setActivePreset(null);
            }}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              mode === 'range'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            Года (диапазон)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('age');
              setActivePreset(null);
            }}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              mode === 'age'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            По возрасту (лет)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('exact');
              setActivePreset(null);
            }}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              mode === 'exact'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            Точный год
          </button>
        </div>
      </div>

      {/* Готовые пресеты клиники */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Быстрые шаблоны для стоматологии:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
                title={preset.description}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Поля ввода параметров */}
      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
        {mode === 'range' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">С года:</span>
              <Input
                type="number"
                min={1920}
                max={currentYear}
                value={yearFrom}
                onChange={(e) => {
                  setYearFrom(Number(e.target.value));
                  setActivePreset(null);
                }}
                className="h-8 w-24 text-xs font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">По год:</span>
              <Input
                type="number"
                min={1920}
                max={currentYear}
                value={yearTo}
                onChange={(e) => {
                  setYearTo(Number(e.target.value));
                  setActivePreset(null);
                }}
                className="h-8 w-24 text-xs font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (возраст примерно от {Math.max(0, currentYear - yearTo)} до {Math.max(0, currentYear - yearFrom)} лет)
            </span>
          </div>
        )}

        {mode === 'age' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Возраст от:</span>
              <Input
                type="number"
                min={0}
                max={120}
                value={ageFrom}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAgeFrom(val);
                  setYearTo(currentYear - val);
                  setActivePreset(null);
                }}
                className="h-8 w-20 text-xs font-medium"
              />
              <span className="text-xs text-slate-500">лет</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">до:</span>
              <Input
                type="number"
                min={0}
                max={120}
                value={ageTo}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAgeTo(val);
                  setYearFrom(currentYear - val);
                  setActivePreset(null);
                }}
                className="h-8 w-20 text-xs font-medium"
              />
              <span className="text-xs text-slate-500">лет</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (года рождения с {currentYear - ageTo} по {currentYear - ageFrom} г.)
            </span>
          </div>
        )}

        {mode === 'exact' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Год рождения:</span>
              <Input
                type="number"
                min={1920}
                max={currentYear}
                value={exactYear}
                onChange={(e) => {
                  setExactYear(Number(e.target.value));
                  setActivePreset(null);
                }}
                className="h-8 w-28 text-xs font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (пациентам сейчас исполнилось {currentYear - exactYear} лет)
            </span>
          </div>
        )}
      </div>

      {/* Статистика выборки */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Всего в базе</p>
          <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">
            {formatNumber(patients.length)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Подходит под фильтр</p>
          <p className="mt-0.5 text-base font-bold text-brand-600 dark:text-brand-400">
            {matchedPatients.length}
          </p>
        </div>

        <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-2.5 dark:border-brand-800/40 dark:bg-brand-900/20">
          <p className="text-[11px] font-medium text-brand-700 dark:text-brand-300">Выбрано получателей</p>
          <p className="mt-0.5 text-base font-bold text-brand-700 dark:text-brand-300">
            {selected.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Без даты рождения</p>
          <p className="mt-0.5 text-base font-bold text-slate-400">
            {withoutBirthDate.length}
          </p>
        </div>
      </div>

      {withoutBirthDate.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            У {withoutBirthDate.length} пациентов в карточке не заполнена дата рождения. Они не включены в эту выборку.
          </span>
        </div>
      )}

      {/* Список подходящих пациентов с чекбоксами */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Список пациентов ({displayedPatients.length})
            </span>
            {matchedPatients.length > 0 && (
              <button
                type="button"
                onClick={isAllSelected ? deselectAll : selectAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                {isAllSelected ? (
                  <>
                    <Square className="h-3.5 w-3.5" /> Снять выбор
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Выбрать всех ({matchedPatients.length})
                  </>
                )}
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО или телефону…"
              className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {displayedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Пациенты не найдены
            </p>
            <p className="text-xs text-slate-400">
              Попробуйте расширить диапазон годов или изменить параметры поиска
            </p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
            {displayedPatients.map((user) => {
              const isChecked = selectedIds.has(user.id);
              const birthInfo = formatBirthInfo(user.birth_date);

              return (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    isChecked && 'bg-brand-50/40 dark:bg-brand-900/10',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleUser(user)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <UserRound className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                        {fullName(user)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatPhone(user.phone)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone="sky" className="text-[11px]">
                      <Calendar className="mr-1 h-3 w-3" />
                      {birthInfo}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
