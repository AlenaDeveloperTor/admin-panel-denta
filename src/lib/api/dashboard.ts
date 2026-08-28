import type { ChartPoint, DashboardStats } from '@/types/dashboard';
import { api } from './client';

export const dashboardAPI = {
  /** KPI-карточки */
  stats: () => api.get<DashboardStats>('/dashboard/stats'),

  /** Данные графика «записи по дням» (last 7/30 дней) */
  chart: (days = 7) => api.get<{ points: ChartPoint[] }>('/dashboard/chart', { params: { days } }),
};
