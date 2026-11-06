'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bannersAPI } from '@/lib/api/banners';
import type { Banner, CreateBannerInput, UpdateBannerInput } from '@/types/banner';

export function useBanners(isActive?: boolean) {
  return useQuery({
    queryKey: ['banners', isActive],
    queryFn: async () => {
      if (isActive !== undefined) {
        const res = await bannersAPI.list(isActive);
        return (res.data ?? []).map((b) => ({ ...b, is_active: isActive }));
      }

      // Бэкенд в схеме BannerResponse не возвращает поле is_active (отсекается при сериализации),
      // но эндпоинт GET /admin/banners поддерживает фильтрацию ?is_active=true / false.
      // Запрашиваем оба списка параллельно, чтобы восстановить реальный статус каждого баннера:
      try {
        const [activeRes, inactiveRes] = await Promise.all([
          bannersAPI.list(true),
          bannersAPI.list(false),
        ]);
        const activeItems = (activeRes.data ?? []).map((b) => ({ ...b, is_active: true }));
        const inactiveItems = (inactiveRes.data ?? []).map((b) => ({ ...b, is_active: false }));

        const activeIds = new Set(activeItems.map((b) => b.id));
        const hasOverlap = inactiveItems.some((b) => activeIds.has(b.id));

        // Если бэкенд корректно фильтрует по query-параметру (нет пересечения по id):
        if (!hasOverlap && (activeItems.length > 0 || inactiveItems.length > 0)) {
          return [...activeItems, ...inactiveItems].sort((a, b) => a.id - b.id);
        }
      } catch (e) {
        console.warn('[useBanners] Failed to split by is_active, falling back to full list', e);
      }

      const response = await bannersAPI.list();
      return response.data;
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBannerInput) => bannersAPI.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBannerInput }) => bannersAPI.update(id, input),
    onSuccess: (_, variables) => {
      // Оптимистично обновляем кэш в React Query, чтобы переключение отображалось сразу
      queryClient.setQueriesData<Banner[]>({ queryKey: ['banners'] }, (old) => {
        if (!old) return old;
        return old.map((b) => (b.id === variables.id ? { ...b, ...variables.input } : b));
      });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bannersAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}