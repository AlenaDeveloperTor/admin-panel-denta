import readXlsxFile from 'read-excel-file/browser';
import type { User } from '@/types/user';

export interface IdentParsedRecord {
  /** Исходная строка или ячейка с телефоном */
  rawPhone: string;
  /** Очищенные 11 цифр (например 79991234567) для надёжного сопоставления */
  cleanDigits: string;
  /** Нормализованный телефон с плюсом (+79991234567) */
  normalizedPhone: string;
  /** ФИО пациента, если удалось извлечь из строки */
  name?: string;
  /** Дополнительная информация (дата рождения, карта, примечание) */
  note?: string;
}

export interface IdentParseResult {
  records: IdentParsedRecord[];
  totalRowsProcessed: number;
  invalidRows: string[];
}

export interface IdentMatchResult {
  /** Пациенты из базы приложения, совпавшие по номеру телефона */
  matchedPatients: User[];
  /** Записи из IDENT, номера которых не найдены в базе мобильного приложения */
  unmatchedRecords: IdentParsedRecord[];
  /** Общее число уникальных телефонов в выгрузке */
  totalIdentPhones: number;
}

/**
 * Очищает номер телефона до 11 цифр с кодом 7 (Россия) или международных цифр.
 * Например:
 *   "+7 (999) 123-45-67" -> "79991234567"
 *   "89991234567"        -> "79991234567"
 *   "9991234567"         -> "79991234567"
 */
export function extractCleanPhoneDigits(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 11) {
    if (digits.startsWith('8') || digits.startsWith('7')) {
      return `7${digits.slice(1)}`;
    }
    return digits;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  // Другие международные форматы (от 10 до 15 цифр)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/** Приводит к формату +79991234567 */
export function formatPhoneE164(cleanDigits: string): string {
  return `+${cleanDigits}`;
}

/**
 * Ищет телефон в ячейке или строке текста с помощью регулярного выражения.
 */
function findPhoneInText(text: string): { phoneStr: string; cleanDigits: string } | null {
  // Ищем комбинации цифр с разделителями, похожие на телефон
  const regex = /(?:\+?[78][\s(-]*)?(?:\d[\s(-]*){10,11}/g;
  const matches = text.match(regex);
  if (!matches) {
    // Попробуем просто проверить, есть ли последовательность из 10-11 цифр
    const directDigits = text.replace(/\D/g, '');
    const clean = extractCleanPhoneDigits(directDigits);
    if (clean) {
      return { phoneStr: text.trim(), cleanDigits: clean };
    }
    return null;
  }

  for (const match of matches) {
    const clean = extractCleanPhoneDigits(match);
    if (clean) {
      return { phoneStr: match.trim(), cleanDigits: clean };
    }
  }

  return null;
}

/**
 * Парсит произвольную строку таблицы (TSV, CSV, точка с запятой или пробелы).
 */
function parseRowColumns(columns: string[]): IdentParsedRecord | null {
  let foundPhone: { phoneStr: string; cleanDigits: string } | null = null;
  let phoneColIndex = -1;

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i].trim();
    if (!col) continue;
    const phone = findPhoneInText(col);
    if (phone) {
      foundPhone = phone;
      phoneColIndex = i;
      break;
    }
  }

  if (!foundPhone) return null;

  // Ищем ФИО в соседних колонках (обычно первая колонка или колонка слева/справа от телефона)
  let name: string | undefined;
  const notes: string[] = [];

  columns.forEach((col, idx) => {
    if (idx === phoneColIndex) return;
    const trimmed = col.trim();
    if (!trimmed) return;

    // Проверяем, похожа ли колонка на ФИО (буквы, пробелы, дефисы, точки)
    if (!name && /^[А-Яа-яA-Za-z\s.-]{3,}$/.test(trimmed) && trimmed.length < 100) {
      name = trimmed;
    } else {
      notes.push(trimmed);
    }
  });

  return {
    rawPhone: foundPhone.phoneStr,
    cleanDigits: foundPhone.cleanDigits,
    normalizedPhone: formatPhoneE164(foundPhone.cleanDigits),
    name,
    note: notes.length > 0 ? notes.join(' | ') : undefined,
  };
}

/**
 * Парсит текст (скопированный из IDENT или Excel через буфер обмена).
 * Поддерживает:
 * - Копирование столбца или таблицы из Excel / IDENT (TSV \t)
 * - CSV через точку с запятой (;) или запятую (,)
 * - Простой список телефонов построчно
 */
export function parseIdentText(text: string): IdentParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const records: IdentParsedRecord[] = [];
  const seenDigits = new Set<string>();
  const invalidRows: string[] = [];

  for (const line of lines) {
    // Пропускаем заголовки таблиц
    if (/^(фио|пациент|телефон|номер|phone|fio|имя)/i.test(line)) {
      continue;
    }

    // Определяем разделитель
    let cols: string[];
    if (line.includes('\t')) {
      cols = line.split('\t');
    } else if (line.includes(';')) {
      cols = line.split(';');
    } else if (line.includes(',')) {
      cols = line.split(',');
    } else {
      cols = [line];
    }

    const record = parseRowColumns(cols);
    if (record) {
      if (!seenDigits.has(record.cleanDigits)) {
        seenDigits.add(record.cleanDigits);
        records.push(record);
      }
    } else {
      // Строка не содержит распознаваемого номера
      if (line.length > 3) {
        invalidRows.push(line);
      }
    }
  }

  return {
    records,
    totalRowsProcessed: lines.length,
    invalidRows,
  };
}

/**
 * Парсит файл выгрузки из IDENT (.xlsx, .xls, .csv, .txt).
 */
export async function parseIdentFile(file: File): Promise<IdentParseResult> {
  const lowerName = file.name.toLowerCase();

  // Excel файлы .xlsx
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    try {
      const sheets = await readXlsxFile(file);
      const rows = sheets[0]?.data ?? [];
      const records: IdentParsedRecord[] = [];
      const seenDigits = new Set<string>();
      const invalidRows: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Преобразуем все ячейки в строки
        const stringCols = row.map((cell: unknown) => (cell != null ? String(cell).trim() : ''));
        const firstCol = stringCols[0] || '';

        // Пропускаем шапку
        if (i === 0 && /^(фио|пациент|телефон|номер|phone|fio|имя)/i.test(firstCol)) {
          continue;
        }

        const record = parseRowColumns(stringCols);
        if (record) {
          if (!seenDigits.has(record.cleanDigits)) {
            seenDigits.add(record.cleanDigits);
            records.push(record);
          }
        } else {
          const rowStr = stringCols.filter(Boolean).join(' | ');
          if (rowStr.length > 3) {
            invalidRows.push(rowStr);
          }
        }
      }

      return {
        records,
        totalRowsProcessed: rows.length,
        invalidRows,
      };
    } catch {
      // Если readXlsxFile не справился (например старый .xls), пробуем как текстовый файл
      const text = await file.text();
      return parseIdentText(text);
    }
  }

  // Текстовые и CSV файлы
  const text = await file.text();
  return parseIdentText(text);
}

/**
 * Сопоставляет распознанные записи IDENT с пациентами из базы данных клиники.
 */
export function matchPatientsWithIdent(
  records: IdentParsedRecord[],
  allPatients: User[],
): IdentMatchResult {
  // Индексируем пациентов базы по очищенным 11 цифрам номера
  const patientByDigits = new Map<string, User>();

  for (const patient of allPatients) {
    if (!patient.phone) continue;
    const clean = extractCleanPhoneDigits(patient.phone);
    if (clean) {
      patientByDigits.set(clean, patient);
    }
  }

  const matchedPatients: User[] = [];
  const matchedPatientIds = new Set<number>();
  const unmatchedRecords: IdentParsedRecord[] = [];

  for (const rec of records) {
    const patient = patientByDigits.get(rec.cleanDigits);
    if (patient) {
      if (!matchedPatientIds.has(patient.id)) {
        matchedPatientIds.add(patient.id);
        matchedPatients.push(patient);
      }
    } else {
      unmatchedRecords.push(rec);
    }
  }

  return {
    matchedPatients,
    unmatchedRecords,
    totalIdentPhones: records.length,
  };
}
