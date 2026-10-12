'use client';

import { useMemo, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clipboard,
  Copy,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
  Square,
  Upload,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { fullName, formatPhone, type User } from '@/types/user';
import {
  parseIdentText,
  parseIdentFile,
  matchPatientsWithIdent,
  type IdentParseResult,
  type IdentMatchResult,
} from '@/lib/ident-parser';
import { cn, formatNumber } from '@/lib/utils';

export interface IdentImportProps {
  allPatients: User[];
  selected: User[];
  onChange: (selected: User[]) => void;
  isLoadingPatients?: boolean;
}

export function IdentImport({
  allPatients,
  selected,
  onChange,
  isLoadingPatients,
}: IdentImportProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [parseResult, setParseResult] = useState<IdentParseResult | null>(null);
  const [matchResult, setMatchResult] = useState<IdentMatchResult | null>(null);

  const [search, setSearch] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showUnmatched, setShowUnmatched] = useState(false);

  // Обработка текстового ввода
  const processText = useCallback(
    (textToProcess: string) => {
      const trimmed = textToProcess.trim();
      if (!trimmed) {
        toast.error('Вставьте текст с номерами или строками из IDENT');
        return;
      }
      setIsProcessing(true);
      try {
        const parsed = parseIdentText(trimmed);
        setParseResult(parsed);

        if (parsed.records.length === 0) {
          toast.warning('Не удалось распознать ни одного номера телефона в тексте');
          setMatchResult(null);
          setIsProcessing(false);
          return;
        }

        const matched = matchPatientsWithIdent(parsed.records, allPatients);
        setMatchResult(matched);
        onChange(matched.matchedPatients);

        toast.success(
          `Распознано: ${parsed.records.length} контактов, найдено в приложении: ${matched.matchedPatients.length}`,
        );
      } catch (err) {
        toast.error('Ошибка при обработке списка');
      } finally {
        setIsProcessing(false);
      }
    },
    [allPatients, onChange],
  );

  // Обработка файла
  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setSelectedFile(file);
      try {
        const parsed = await parseIdentFile(file);
        setParseResult(parsed);

        if (parsed.records.length === 0) {
          toast.warning('В файле не найдено номеров телефонов');
          setMatchResult(null);
          setIsProcessing(false);
          return;
        }

        const matched = matchPatientsWithIdent(parsed.records, allPatients);
        setMatchResult(matched);
        onChange(matched.matchedPatients);

        toast.success(
          `Файл обработан: найдено ${matched.matchedPatients.length} пациентов из ${parsed.records.length} контактов`,
        );
      } catch (err) {
        toast.error('Не удалось прочитать файл. Проверьте формат .xlsx или .csv');
      } finally {
        setIsProcessing(false);
      }
    },
    [allPatients, onChange],
  );

  // Drag and drop для файла
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    [processFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  // Вставка из буфера обмена
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.info('Буфер обмена пуст');
        return;
      }
      setRawText(text);
      processText(text);
    } catch {
      toast.error('Разрешите доступ к буферу обмена или вставьте текст вручную (Ctrl+V)');
    }
  };

  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);

  const togglePatient = (patient: User) => {
    if (selectedIds.has(patient.id)) {
      onChange(selected.filter((u) => u.id !== patient.id));
    } else {
      onChange([...selected, patient]);
    }
  };

  const selectAll = () => {
    if (matchResult) {
      onChange(matchResult.matchedPatients);
    }
  };

  const deselectAll = () => {
    onChange([]);
  };

  const isAllSelected =
    matchResult != null &&
    matchResult.matchedPatients.length > 0 &&
    selected.length === matchResult.matchedPatients.length;

  // Фильтр по поисковой строке
  const displayedPatients = useMemo(() => {
    if (!matchResult) return [];
    const q = search.trim().toLowerCase();
    if (!q) return matchResult.matchedPatients;
    return matchResult.matchedPatients.filter((u) => {
      const name = fullName(u).toLowerCase();
      const phone = (u.phone || '').replace(/\D/g, '');
      return name.includes(q) || phone.includes(q.replace(/\D/g, ''));
    });
  }, [matchResult, search]);

  // Копирование ненайденных номеров
  const copyUnmatched = () => {
    if (!matchResult || matchResult.unmatchedRecords.length === 0) return;
    const text = matchResult.unmatchedRecords
      .map((r) => `${r.normalizedPhone}${r.name ? `\t${r.name}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Список ненайденных контактов скопирован в буфер');
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Шапка компонента */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Загрузка списка из IDENT
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Вставка скопированной таблицы или загрузка файла выгрузки из МИС IDENT
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInstructions((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {showInstructions ? 'Скрыть инструкцию' : 'Как сделать выгрузку из IDENT?'}
        </button>
      </div>

      {/* Инструкция по экспорту */}
      {showInstructions && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3 text-xs text-slate-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-slate-300">
          <p className="font-semibold text-brand-900 dark:text-brand-200">
            Инструкция по выгрузке из IDENT в рассылку:
          </p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs">
            <li>
              В программе <strong>IDENT</strong> откройте <strong>Отчёты → Пациенты</strong> (или нужный отчёт с аудиторией).
            </li>
            <li>
              <strong>Способ А (быстрый копипаст):</strong> выделите строки или столбец с телефонами и нажмите{' '}
              <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[11px] shadow-sm dark:bg-slate-800">Ctrl+C</kbd>. Затем нажмите «Вставить из буфера» ниже.
            </li>
            <li>
              <strong>Способ Б (файл):</strong> нажмите в IDENT «Экспорт» → сохраните как Excel (.xlsx) или CSV, и перетащите файл в область ниже.
            </li>
            <li>
              Система автоматически найдёт этих пациентов в базе мобильного приложения и подготовит push-рассылку.
            </li>
          </ol>
        </div>
      )}

      {/* Переключатель способа: Вставка текста / Загрузка файла */}
      <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all',
            activeTab === 'paste'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          <Clipboard className="h-3.5 w-3.5" /> Вставить текст / таблицу (Ctrl+V)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all',
            activeTab === 'file'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          <Upload className="h-3.5 w-3.5" /> Загрузить файл (.xlsx, .csv)
        </button>
      </div>

      {/* Вкладка 1: Вставка текста */}
      {activeTab === 'paste' && (
        <div className="space-y-2">
          <Textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Вставьте скопированный столбец или таблицу из IDENT / Excel:
Иванов Иван Иванович	+7 (999) 123-45-67	2005
Петрова Анна	89162223344
+79035554433`}
            className="font-mono text-xs"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteClipboard}
                className="h-8 text-xs"
              >
                <Clipboard className="h-3.5 w-3.5" /> Вставить из буфера
              </Button>
              {rawText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRawText('');
                    setParseResult(null);
                    setMatchResult(null);
                    onChange([]);
                  }}
                  className="h-8 text-xs text-slate-400 hover:text-rose-500"
                >
                  <X className="h-3.5 w-3.5" /> Очистить
                </Button>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              loading={isProcessing}
              onClick={() => processText(rawText)}
              disabled={!rawText.trim() || isProcessing}
              className="h-8 text-xs"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Обработать и сопоставить с базой
            </Button>
          </div>
        </div>
      )}

      {/* Вкладка 2: Загрузка файла */}
      {activeTab === 'file' && (
        <div className="space-y-2">
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors',
              isDragActive
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40',
            )}
          >
            <input {...getInputProps()} />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200">
              {isDragActive
                ? 'Отпустите файл для загрузки'
                : 'Перетащите сюда файл выгрузки из IDENT или нажмите для выбора'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Поддерживаются форматы Excel (.xlsx, .xls), CSV (.csv) и TXT
            </p>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <FileText className="h-3.5 w-3.5" />
                <span>{selectedFile.name}</span>
                <span className="text-[10px] text-brand-500">
                  ({(selectedFile.size / 1024).toFixed(1)} КБ)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Результаты сопоставления с базой */}
      {matchResult && (
        <div className="space-y-3 pt-2">
          {/* Статистические карточки */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Всего в выгрузке</p>
              <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(matchResult.totalIdentPhones)} контактов
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-900/20">
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Найдено в приложении
              </div>
              <p className="mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-300">
                {matchResult.matchedPatients.length} пациентов
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 dark:border-amber-800/40 dark:bg-amber-900/20">
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" /> Не зарегистрированы
              </div>
              <p className="mt-0.5 text-base font-bold text-amber-700 dark:text-amber-300">
                {matchResult.unmatchedRecords.length} контактов
              </p>
            </div>
          </div>

          {/* Плашка с информацией о ненайденных */}
          {matchResult.unmatchedRecords.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    {matchResult.unmatchedRecords.length} контактов из выгрузки IDENT ещё не установили мобильное приложение клиники.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowUnmatched((prev) => !prev)}
                    className="underline text-amber-900 hover:text-amber-950 dark:text-amber-200 font-medium"
                  >
                    {showUnmatched ? 'Скрыть список' : 'Показать контакты'}
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyUnmatched}
                    className="h-7 text-[11px] bg-white text-amber-800 border-amber-200 hover:bg-amber-100/60 dark:bg-slate-900 dark:text-amber-300"
                  >
                    <Copy className="h-3 w-3" /> Скопировать
                  </Button>
                </div>
              </div>

              {/* Раскрывающийся список ненайденных */}
              {showUnmatched && (
                <div className="mt-2.5 max-h-36 overflow-y-auto rounded border border-amber-200 bg-white/80 p-2 font-mono text-[11px] dark:border-slate-800 dark:bg-slate-900/80">
                  {matchResult.unmatchedRecords.map((r, i) => (
                    <div key={i} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <span>{r.normalizedPhone}</span>
                      {r.name && <span className="text-slate-500 font-sans">{r.name}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Список найденных пациентов */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Готовы к отправке ({displayedPatients.length})
                </span>
                {matchResult.matchedPatients.length > 0 && (
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
                        <CheckSquare className="h-3.5 w-3.5" /> Выбрать всех ({matchResult.matchedPatients.length})
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
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                <Users className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Пациенты не найдены
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
                {displayedPatients.map((user) => {
                  const isChecked = selectedIds.has(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => togglePatient(user)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                        isChecked && 'bg-brand-50/40 dark:bg-brand-900/10',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePatient(user)}
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
                        <Badge tone="emerald" className="text-[11px]">
                          <UserCheck className="mr-1 h-3 w-3" />
                          В приложении
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
