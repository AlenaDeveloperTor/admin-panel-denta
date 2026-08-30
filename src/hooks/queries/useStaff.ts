'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffAPI, type StaffCreateInput } from '@/lib/api/staff';
import type { StaffMember } from '@/types/staff';

/**
 * Сотрудники: получение из реального API (/admin/staff).
 */
export function useStaffList() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffAPI.list({ limit: 100 });
      const items = Array.isArray(res.data) ? res.data : (res.data as { items?: StaffMember[] })?.items ?? [];
      return items;
    },
    retry: 1,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StaffCreateInput) => {
      return await staffAPI.create(input).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<StaffCreateInput> }) => {
      return await staffAPI.update(id, input).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useToggleStaffBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, blocked }: { id: number; blocked: boolean }) => {
      return await staffAPI.update(id, { is_blocked: blocked }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await staffAPI.remove(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
