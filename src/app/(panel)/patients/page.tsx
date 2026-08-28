'use client';

import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { PatientCard } from '@/components/patients/patient-card';
import { useDebounce } from '@/hooks/useDebounce';
import { useDeleteUser, useUsers } from '@/hooks/queries/useUsers';
import { fullName, formatPhone } from '@/types/user';
import type { User } from '@/types/user';
import { formatDate, formatNumber, getErrorMessage } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [pointsFilter, setPointsFilter] = useState('all'); // all | points
  const [registeredFilter, setRegisteredFilter] = useState('all'); // all | 7d | 30d
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);

  const dateFrom = useMemo(() => {
    if (registeredFilter === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    }
    if (registeredFilter === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    }
    return undefined;
  }, [registeredFilter]);

  const { data, isLoading, isFetching } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    has_points: pointsFilter === 'points' ? true : undefined,
    ...(dateFrom ? { date_from: dateFrom } : {}),
  });

  const deleteUser = useDeleteUser();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success('Пациент удалён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '#',
        cell: ({ row }) => <span className="text-slate-400">{row.original.id}</span>,
      },
      {
        accessorKey: 'full_name',
        header: 'ФИО',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <UserRound className="h-4 w-4" />
            </div>
            <span className="font-medium">{fullName(row.original)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Телефон',
        cell: ({ row }) => <span className="whitespace-nowrap">{formatPhone(row.original.phone)}</span>,
      },
      {
        accessorKey: 'loyalty_balance',
        header: 'Баллы',
        cell: ({ row }) => (
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            {formatNumber(row.original.loyalty_balance)}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Регистрация',
        cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCardId(row.original.id)} aria-label="Карточка пациента">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditing(row.original)} aria-label="Редактировать">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
              onClick={() => setDeleting(row.original)}
              aria-label="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Пациенты"
        subtitle={data ? `Всего: ${formatNumber(data.total)}` : undefined}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Добавить пациента
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Поиск по телефону или ФИО…"
          className="w-full lg:max-w-xs"
        />
        <div className="flex flex-wrap gap-3">
          <Select
            value={pointsFilter}
            onChange={(e) => {
              setPointsFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Все пациенты' },
              { value: 'points', label: 'С баллами (>0)' },
            ]}
            className="w-44"
          />
          <Select
            value={registeredFilter}
            onChange={(e) => {
              setRegisteredFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Все даты регистрации' },
              { value: '7d', label: 'За 7 дней' },
              { value: '30d', label: 'За месяц' },
            ]}
            className="w-52"
          />
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading || (isFetching && !data)}
          emptyTitle="Пациенты не найдены"
          emptyDescription="Измените параметры поиска или добавьте нового пациента"
          onRowClick={(row) => setCardId(row.id)}
        />
        <Pagination
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onChange={setPage}
          total={data?.total}
        />
      </Card>

      <PatientFormModal open={createOpen} onClose={() => setCreateOpen(false)} user={null} />
      <PatientCard userId={cardId} onClose={() => setCardId(null)} />
      <PatientFormModal open={Boolean(editing)} onClose={() => setEditing(null)} user={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Удалить пациента?"
        message={`Пациент «${deleting ? fullName(deleting) : ''}» будет удалён без возможности восстановления. Его история записей также будет удалена.`}
        loading={deleteUser.isPending}
      />
    </div>
  );
}
