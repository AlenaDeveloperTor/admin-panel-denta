/** Операция по бонусной программе */
export interface LoyaltyTransaction {
  id: string | number;
  user_id?: number;
  phone?: string;
  user_name?: string;
  /** + начисление, - списание */
  amount: number;
  reason: string;
  /** ручная операция админа / авто-начисление */
  source?: 'manual' | 'auto';
  created_at: string;
}

export interface LoyaltyHistoryResponse {
  items: LoyaltyTransaction[];
  total: number;
  page: number;
  limit: number;
}

/** Входные данные ручного начисления/списания баллов */
export interface AdjustLoyaltyInput {
  user_id: number;
  /** положительное — начисление, отрицательное — списание */
  amount: number;
  reason: string;
}
