'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsAPI } from '@/lib/api/appointments';
import { normalizePage } from '@/lib/api/normalize';
import type { Appointment, AppointmentFilters, AppointmentStatus, CreateAppointmentInput } from '@/types/appointment';

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const res = await appointmentsAPI.list({
        page: filters.page,
        limit: filters.limit,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
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

/** Последние записи для дашборда */
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
      const res = await appointmentsAPI.list({ user_id: userId ?? undefined, limit });
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
