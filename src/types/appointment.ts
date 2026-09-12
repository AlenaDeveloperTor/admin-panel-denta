import type { Service } from './service';
import type { User } from './user';

// Бэкенд поддерживает только эти статусы: 'created' | 'confirmed' | 'completed' | 'cancelled'
export const APPOINTMENT_STATUSES = ['created', 'confirmed', 'cancelled', 'completed'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  created: 'Новая заявка',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
};

/**
 * Запись на приём (по контракту бэкенда).
 * Время визита — единое поле `appointment_datetime` (ISO 8601),
 * заполняется админом/менеджером при подтверждении записи.
 */
export interface Appointment {
  id: string;
  user_id?: number;
  patient?: User | null;
  service_id: string;
  service?: Service | null;
  /** ISO datetime записи, напр. "2026-08-25T15:00:00Z" (может быть null у новых заявок) */
  appointment_datetime?: string | null;
  status: AppointmentStatus;
  comment?: string;
  created_at?: string;
}

export interface CreateAppointmentInput {
  user_id?: number;
  service_id: string;
  appointment_datetime: string;
  comment?: string;
}

export interface AppointmentFilters {
  date_from?: string;
  date_to?: string;
  status?: AppointmentStatus | '';
  page?: number;
  limit?: number;
}

/** Цвет статуса для календаря/бейджей */
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  created: 'sky',
  confirmed: 'emerald',
  cancelled: 'rose',
  completed: 'slate',
};

/** Дата "YYYY-MM-DD" из appointment_datetime */
export function appointmentDate(
  a: Pick<Appointment, 'appointment_datetime'> | null | undefined,
): string | null {
  if (!a?.appointment_datetime) return null;
  return a.appointment_datetime.slice(0, 10);
}

/** Время "HH:MM" из appointment_datetime */
export function appointmentTime(
  a: Pick<Appointment, 'appointment_datetime'> | null | undefined,
): string | null {
  if (!a?.appointment_datetime) return null;
  return a.appointment_datetime.slice(11, 16);
}
