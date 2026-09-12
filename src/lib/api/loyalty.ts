import type {
  AdjustLoyaltyInput,
  LoyaltyHistoryResponse,
  LoyaltyTransaction,
} from '@/types/loyalty';
import { api } from './client';

/**
 * API лояльности (по контракту бэкенда, project_tasks.md §4.6).
 * Лояльность работает только вручную: без правил/автоначисления.
 * - История: GET /admin/loyalty/history?phone=&user_id=&page=&limit=
 * - Ручное начисление/списание: POST /admin/loyalty/transactions
 */
export const loyaltyAPI = {
  /** История операций (пагинация, поиск по phone или user_id) */
  history: (params: { phone?: string; user_id?: number; page?: number; limit?: number }) =>
    api.get<LoyaltyHistoryResponse>('/loyalty/history', { params }),

  /** Ручное начисление/списание баллов пациенту (amount может быть отрицательным) */
  adjustBalance: (input: AdjustLoyaltyInput) =>
    api.post<LoyaltyTransaction>('/loyalty/transactions', input),
};
