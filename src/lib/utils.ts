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
