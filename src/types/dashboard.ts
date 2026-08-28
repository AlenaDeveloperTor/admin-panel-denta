/** KPI для карточек дашборда */
export interface DashboardStats {
  total_patients: number;
  appointments_today: number;
  new_patients_month: number;
  total_loyalty_points?: number;
  appointments_pending?: number;
  revenue_month?: number;
}

/** Точка графика «записи по дням» */
export interface ChartPoint {
  date: string;
  count: number;
}

export interface DashboardChartResponse {
  points: ChartPoint[];
}
