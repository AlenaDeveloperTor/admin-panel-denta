import type { Appointment } from '@/types/appointment';
import { formatDateTimeInTimeZone } from './utils';

/** Готовые тексты push-уведомлений, которые отправляются автоматически */
export interface GeneratedPush {
  title: string;
  body: string;
  category: 'system';
}

/** Имя пациента для обращения, напр. «Иван» */
function firstName(user: Appointment['patient']): string | null {
  const name = user?.first_name?.trim();
  return name || null;
}

/** Push о создании новой записи администратором */
export function buildCreationPush(appointment: Appointment, timeZone = 'Europe/Moscow'): GeneratedPush {
  const name = firstName(appointment.patient);
  const greeting = name ? `${name}, ` : '';
  const service = appointment.service?.name ?? 'запись';
  const when = appointment.appointment_datetime 
    ? formatDateTimeInTimeZone(appointment.appointment_datetime, timeZone)
    : '';
  return {
    title: 'Новая запись в клинику',
    body: `${greeting}вы записаны на «${service}»${when ? ` — ${when}` : ''}. Ждём вас!`,
    category: 'system',
  };
}

/** Push о подтверждении записи */
export function buildConfirmationPush(appointment: Appointment, timeZone = 'Europe/Moscow'): GeneratedPush {
  const name = firstName(appointment.patient);
  const greeting = name ? `Уважаемый(ая) ${name}! ` : '';
  const service = appointment.service?.name ?? 'ваша запись';
  const when = appointment.appointment_datetime
    ? formatDateTimeInTimeZone(appointment.appointment_datetime, timeZone)
    : '';
  return {
    title: 'Запись подтверждена',
    body: `${greeting}${service} подтверждена${when ? ` на ${when}` : ''}. Будем рады видеть вас в клинике!`,
    category: 'system',
  };
}

/** Push об отмене записи */
export function buildCancellationPush(appointment: Appointment): GeneratedPush {
  const name = firstName(appointment.patient);
  const greeting = name ? `Уважаемый(ая) ${name}! ` : '';
  const service = appointment.service?.name ?? 'Ваша запись';
  return {
    title: 'Запись отменена',
    body: `${greeting}К сожалению, ${service.toLowerCase()} пришлось отменить. Позвоните нам, чтобы подобрать новое время.`,
    category: 'system',
  };
}
