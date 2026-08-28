'use client';

import { CalendarCheck2, Clock4, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AppointmentsChart } from '@/components/dashboard/appointments-chart';
import { RecentAppointments } from '@/components/dashboard/recent-appointments';
import { useDashboardChart, useDashboardStats } from '@/hooks/queries/useDashboard';
import { useMe } from '@/hooks/queries/useAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chart, isLoading: chartLoading } = useDashboardChart(7);
  useMe();

  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Дашборд"
        subtitle={firstName ? `Добро пожаловать, ${firstName}!` : 'Обзор работы клиники'}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Всего пациентов"
          value={formatNumber(stats?.total_patients)}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
          loading={statsLoading}
        />
        <KpiCard
          label="Записей сегодня"
          value={formatNumber(stats?.appointments_today)}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          tone="emerald"
          loading={statsLoading}
        />
        <KpiCard
          label="Пациентов за месяц"
          value={formatNumber(stats?.new_patients_month)}
          icon={<UserPlus className="h-5 w-5" />}
          tone="violet"
          loading={statsLoading}
        />
        <KpiCard
          label="Новые заявки"
          value={formatNumber(stats?.appointments_pending)}
          icon={<Clock4 className="h-5 w-5" />}
          tone="amber"
          loading={statsLoading}
          linkTo="/requests"
          hint="Ожидают подтверждения"
        />
      </div>

      <AppointmentsChart data={chart ?? []} loading={chartLoading} days={7} />

      <RecentAppointments />
    </div>
  );
}
