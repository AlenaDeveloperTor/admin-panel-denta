'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffAPI, type StaffCreateInput } from '@/lib/api/staff';
import { useStaffStore } from '@/stores/useStaffStore';
import type { StaffMember } from '@/types/staff';

/**
 * Сотрудники: сначала реальный API (/admin/staff).
 * Если бэкенд недоступен (не запущен / 404/405) — работаем с локальным стором (демо),
 * чтобы раздел был тестируемым до подключения бэкенда.
 */

export function useStaffList() {
  const localStaff = useStaffStore((s) => s.staff);
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const res = await staffAPI.list({ limit: 100 });
        const items = Array.isArray(res.data) ? res.data : (res.data as { items?: StaffMember[] })?.items ?? [];
        return items;
      } catch {
        return localStaff;
      }
    },
    placeholderData: () => localStaff,
    retry: false,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  const addLocal = useStaffStore((s) => s.addStaff);
  return useMutation({
    mutationFn: async (input: StaffCreateInput) => {
      try {
        return await staffAPI.create(input).then((r) => r.data);
      } catch {
        return addLocal(input); // демо: локальное хранилище
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  const updateLocal = useStaffStore((s) => s.updateStaff);
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: Partial<StaffCreateInput> }) => {
      try {
        return await staffAPI.update(id, input).then((r) => r.data);
      } catch {
        updateLocal(id, input);
        return undefined;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useToggleStaffBlock() {
  const qc = useQueryClient();
  const toggleLocal = useStaffStore((s) => s.toggleBlock);
  return useMutation({
    mutationFn: async ({ id, blocked }: { id: number; blocked: boolean }) => {
      try {
        return await staffAPI.update(id, { is_blocked: blocked }).then((r) => r.data);
      } catch {
        toggleLocal(id);
        return undefined;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  const removeLocal = useStaffStore((s) => s.removeStaff);
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await staffAPI.remove(id);
      } catch {
        removeLocal(id);
        return undefined;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
