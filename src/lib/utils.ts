import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Объединение классов Tailwind без конфликтов */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Получение текста ошибки из Axios/ответа API. Поддерживает:
 *  - кастомный формат бэкенда: { status: "error", error: { code, msg } }
 *  - стандарт FastAPI: { detail: "..." }
 *  - простые { message } / { error: "..." }
 */
export function getErrorMessage(error: unknown, fallback = 'Произошла ошибка. Попробуйте ещё раз.'): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: unknown }; message?: string };
    const data = e.response?.data as
      | { status?: string; error?: unknown; message?: string; detail?: string }
      | undefined;

    if (data) {
      // { status: "error", error: { code, msg } }
      if (typeof data.error === 'object' && data.error !== null) {
        const err = data.error as { code?: string; msg?: string; message?: string };
        if (err.msg) return err.msg;
        if (err.message) return err.message;
        if (err.code) return err.code;
      }
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (data.message) return data.message;
    }
    if (e.message) return e.message;
  }
  if (typeof error === 'string') return error;
  return fallback;
}

/** Формат даты и времени в «человеческом» виде */
export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Преобразует datetime-local, заданный в timezone клиники, в UTC ISO. */
export function clinicDatetimeToUTC(value: string, timeZone: string): string {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const wallClockMs = Date.UTC(year, month - 1, day, hours, minutes);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  let timestamp = wallClockMs;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(new Date(timestamp));
    const values = Object.fromEntries(
      parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
    );
    const displayedMs = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    );
    timestamp += wallClockMs - displayedMs;
  }

  return new Date(timestamp).toISOString();
}

/** Форматирует UTC ISO в локальное время клиники. */
export function formatDateTimeInTimeZone(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Короткий формат даты */
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

/** Число с пробелами, напр. 1 234 */
export function formatNumber(value: number | undefined | null): string {
  if (value == null) return '0';
  return new Intl.NumberFormat('ru-RU').format(value);
}
