'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsAPI } from '@/lib/api/appointments';
import { normalizePage } from '@/lib/api/normalize';
import type { Appointment, AppointmentFilters, AppointmentStatus, CreateAppointmentInput } from '@/types/appointment';

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      // Бэкенд /admin/appointments принимает date_from/date_to в формате ISO datetime
      // Конвертируем YYYY-MM-DD → YYYY-MM-DDTHH:mm:ss
      const toDatetime = (d?: string) =>
        d ? (d.includes('T') ? d : `${d}T00:00:00`) : undefined;
      const toDatetimeEnd = (d?: string) =>
        d ? (d.includes('T') ? d : `${d}T23:59:59`) : undefined;

      const res = await appointmentsAPI.list({
        page: filters.page,
        limit: filters.limit,
        date_from: toDatetime(filters.date_from),
        date_to: toDatetimeEnd(filters.date_to),
        status: filters.status || undefined,
      });
      return normalizePage<Appointment>(res.data, filters.page ?? 1, filters.limit ?? 50);
    },
    placeholderData: (prev) => prev,
  });
}

export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsAPI.getById(id as string).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useRecentAppointments(limit = 5) {
  return useQuery({
    queryKey: ['appointments', 'recent', limit],
    queryFn: async () => {
      const res = await appointmentsAPI.list({ limit });
      return normalizePage<Appointment>(res.data, 1, limit).items;
    },
  });
}

/** История записей конкретного пациента (карточка пациента) */
export function usePatientAppointments(userId: number | null, limit = 10) {
  return useQuery({
    queryKey: ['appointments', 'patient', userId],
    queryFn: async () => {
      const res = await appointmentsAPI.list({ user_id: userId ?? undefined, page: 1, limit });
      return normalizePage<Appointment>(res.data, 1, limit).items;
    },
    enabled: Boolean(userId),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentsAPI.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsAPI.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status?: AppointmentStatus;
        appointment_datetime?: string;
        service_id?: number | string;
        comment?: string;
      };
    }) => appointmentsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

