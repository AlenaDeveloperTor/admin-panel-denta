import { appointmentDate, appointmentTime } from '@/types/appointment';
import type { Appointment } from '@/types/appointment';
import { formatDate } from './utils';

/** Готовые тексты push-уведомлений, которые отправляются автоматически */
export interface GeneratedPush {
  title: string;
  body: string;
  deep_link: string;
}

/** Имя пациента для обращения, напр. «Иван» */
function firstName(user: Appointment['patient']): string | null {
  const name = user?.first_name?.trim();
  return name || null;
}

/** Push о подтверждении записи */
export function buildConfirmationPush(appointment: Appointment): GeneratedPush {
  const name = firstName(appointment.patient);
  const greeting = name ? `Уважаемый(ая) ${name}! ` : '';
  const service = appointment.service?.name ?? 'ваша запись';
  const when = appointment.appointment_datetime
    ? `${formatDate(appointmentDate(appointment) ?? '')} в ${appointmentTime(appointment)}`
    : '';
  return {
    title: 'Запись подтверждена',
    body: `${greeting}${service} подтверждена${when ? ` на ${when}` : ''}. Будем рады видеть вас в клинике!`,
    deep_link: 'app://appointments',
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
    deep_link: 'app://appointments',
  };
}
