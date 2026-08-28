'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loyaltyAPI } from '@/lib/api/loyalty';
import { normalizePage } from '@/lib/api/normalize';
import type { AdjustLoyaltyInput, LoyaltyTransaction } from '@/types/loyalty';

/** История операций по лояльности (пагинация, поиск по телефону) */
export function useLoyaltyHistory(params: {
  phone?: string;
  user_id?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['loyalty', 'history', params],
    queryFn: async () => {
      const res = await loyaltyAPI.history(params);
      return normalizePage<LoyaltyTransaction>(res.data, params.page ?? 1, params.limit ?? 20);
    },
    enabled: Boolean(params.phone || params.user_id),
    placeholderData: (prev) => prev,
  });
}

/** Ручное начисление/списание баллов */
export function useAdjustLoyaltyBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustLoyaltyInput) => loyaltyAPI.adjustBalance(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty', 'history'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
