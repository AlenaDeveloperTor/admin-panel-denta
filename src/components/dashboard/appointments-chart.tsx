'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartPoint } from '@/types/dashboard';

export function AppointmentsChart({
  data,
  loading,
  days = 7,
}: {
  data: ChartPoint[];
  loading?: boolean;
  days?: number;
}) {
  const chartData = data.map((p) => ({
    label: formatDay(p.date),
    date: p.date,
    Записи: p.count,
  }));

  return (
    <Card>
      <CardHeader title={`Записи по дням · последние ${days} дней`} subtitle="Количество созданных записей" />
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Нет данных для графика
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400" />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgb(226 232 240)',
                    fontSize: 12,
                    background: 'var(--color-slate-50, #fff)',
                  }}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                <Bar dataKey="Записи" fill="var(--color-brand-500, #14b8a6)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(d);
}
