'use client';

import { PageHeader } from '@/components/shared/page-header';
import { StaffList } from '@/components/staff/staff-list';

export default function StaffPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Сотрудники"
        subtitle="Учётные записи сотрудников клиники (доступно только основному администратору)"
      />

      <StaffList />
    </div>
  );
}
