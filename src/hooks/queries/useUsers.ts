'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersAPI, fetchAllPatients } from '@/lib/api/users';
import { normalizePage } from '@/lib/api/normalize';
import type { CreateUserInput, UpdateUserInput, User } from '@/types/user';

export interface UsersQueryParams {
  page: number;
  limit: number;
  search?: string;
  has_points?: boolean;
  date_from?: string;
  date_to?: string;
}

export function useUsers(params: UsersQueryParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await usersAPI.list(params);
      return normalizePage<User>(res.data, params.page, params.limit);
    },
    placeholderData: (prev) => prev,
  });
}

/** Загрузка всей базы пациентов с кэшированием (для фильтров рассылки) */
export function useAllPatients() {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => fetchAllPatients(),
    staleTime: 60_000,
  });
}


/** Детали пациента по id */
export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getById(id as number).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersAPI.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) =>
      usersAPI.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersAPI.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
