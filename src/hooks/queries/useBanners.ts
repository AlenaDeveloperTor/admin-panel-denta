'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bannersAPI } from '@/lib/api/banners';
import type { CreateBannerInput, UpdateBannerInput } from '@/types/banner';

export function useBanners(isActive?: boolean) {
  return useQuery({
    queryKey: ['banners', isActive],
    queryFn: () => bannersAPI.list(isActive).then((response) => response.data),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bannersAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}