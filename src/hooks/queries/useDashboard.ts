'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api/dashboard';
import type { ChartPoint, DashboardStats } from '@/types/dashboard';

/** KPI-карточки; автообновление каждые 60с (ТЗ §3, опционально) */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardAPI.stats().then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useDashboardChart(days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'chart', days],
    queryFn: async () => {
      const res = await dashboardAPI.chart(days);
      const points: ChartPoint[] = res.data?.points ?? [];
      return points;
    },
    refetchInterval: 60_000,
  });
}
