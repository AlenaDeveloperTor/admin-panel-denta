'use client';

import { PageHeader } from '@/components/shared/page-header';
import { ClinicSettingsForm } from '@/components/settings/clinic-settings-form';
import { SessionsList } from '@/components/settings/sessions-list';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" subtitle="Данные клиники и журнал безопасности" />
      <ClinicSettingsForm />
      <SessionsList />
    </div>
  );
}
