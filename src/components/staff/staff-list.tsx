'use client';

import { useMemo, useState } from 'react';
import {
  Ban,
  CircleCheck,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StaffFormModal } from './staff-form-modal';
import { useStaffList, useToggleStaffBlock, useDeleteStaff } from '@/hooks/queries/useStaff';
import { ROLE_LABELS } from '@/types/staff';
import type { StaffMember } from '@/types/staff';
import { formatDate, getErrorMessage } from '@/lib/utils';

export function StaffList() {
  const { data: staff = [], isLoading } = useStaffList();
  const toggleBlock = useToggleStaffBlock();
  const deleteStaff = useDeleteStaff();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteStaff.mutateAsync(deleting.id);
      toast.success('Сотрудник удалён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<StaffMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Сотрудник',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-900/30">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800 dark:text-slate-200">{row.original.name}</p>
              <p className="truncate text-xs text-slate-400">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Роль',
        cell: ({ row }) =>
          row.original.role === 'admin' ? (
            <Badge tone="violet">
              <ShieldCheck className="h-3 w-3" /> {ROLE_LABELS.admin}
            </Badge>
          ) : (
            <Badge tone="sky">{ROLE_LABELS.manager}</Badge>
          ),
      },
      {
        accessorKey: 'is_blocked',
        header: 'Статус',
        cell: ({ row }) =>
          row.original.is_blocked ? (
            <Badge tone="rose">Заблокирован</Badge>
          ) : (
            <Badge tone="emerald">Активен</Badge>
          ),
      },
      {
        accessorKey: 'created_at',
        header: 'Создан',
        cell: ({ row }) => (
          <span className="text-slate-500 dark:text-slate-400">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditing(row.original)} aria-label="Редактировать">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={row.original.is_blocked ? 'text-emerald-600' : 'text-amber-500'}
              onClick={() => {
                const newBlocked = !row.original.is_blocked;
                toggleBlock.mutate(
                  { id: row.original.id, blocked: newBlocked },
                  {
                    onSuccess: () => toast.success(newBlocked ? 'Сотрудник заблокирован' : 'Сотрудник разблокирован'),
                    onError: (e) => toast.error(getErrorMessage(e)),
                  },
                );
              }}
              aria-label={row.original.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            >
              {row.original.is_blocked ? <CircleCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <Card>
        <DataTable
          columns={columns}
          data={staff}
          loading={isLoading}
          emptyTitle="Сотрудников пока нет"
          emptyDescription="Создайте первую учётную запись"
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Новый сотрудник
        </Button>
      </div>

      <StaffFormModal open={createOpen} onClose={() => setCreateOpen(false)} staff={null} />
      <StaffFormModal open={Boolean(editing)} onClose={() => setEditing(null)} staff={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Удалить сотрудника?"
        message={`Учётная запись «${deleting?.name ?? ''}» будет удалена. Сотрудник больше не сможет войти в панель.`}
        confirmText="Удалить"
      />
    </>
  );
}
