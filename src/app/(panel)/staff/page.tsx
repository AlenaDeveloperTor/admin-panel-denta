'use client';

import { Info } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StaffList } from '@/components/staff/staff-list';

export default function StaffPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Сотрудники"
        subtitle="Учётные записи сотрудников клиники (доступно только основному администратору)"
      />

      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Работает через <code className="font-mono">/admin/staff</code>. Пока бэкенд не подключён — данные
          хранятся локально (демо). Иконка <code className="font-mono">⤳</code> — вход под учёткой для теста.
          Основной администратор: <b>director@clinic.ru</b> / <b>director123</b>.
        </p>
      </div>

      <StaffList />
    </div>
  );
}
