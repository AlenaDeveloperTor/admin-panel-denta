import type { Appointment, AppointmentStatus, CreateAppointmentInput } from '@/types/appointment';
import { api } from './client';

export const appointmentsAPI = {
  /** Список записей с фильтрами и пагинацией (date_from/date_to по appointment_datetime) */
  list: (params: Record<string, string | number | boolean | undefined>) =>
    api.get('/appointments', { params }),

  /** Детали записи */
  getById: (id: string) => api.get<Appointment>(`/appointments/${id}`),

  /** Создать запись админом: { user_id, service_id, appointment_datetime, comment } */
  create: (input: CreateAppointmentInput) => api.post<Appointment>('/appointments', input),

  /** Обновить статус записи: { status: 'confirmed' } */
  updateStatus: (id: string, status: AppointmentStatus) =>
    api.patch<Appointment>(`/appointments/${id}`, { status }),

  /** Частичное обновление записи (PATCH /admin/appointments/{id}) */
  update: (
    id: string,
    data: {
      status?: AppointmentStatus;
      appointment_datetime?: string;
      service_id?: number | string;
      comment?: string;
    }
  ) => api.patch<Appointment>(`/appointments/${id}`, data),
};
