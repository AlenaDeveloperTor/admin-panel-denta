'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '@/lib/api/services';
import type { CreateServiceInput, Service, UpdateServiceInput } from '@/types/service';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => servicesAPI.list().then((r) => r.data),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => servicesAPI.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      servicesAPI.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesAPI.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
