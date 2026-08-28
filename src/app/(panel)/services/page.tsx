'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ServiceFormModal } from '@/components/services/service-form-modal';
import { useDeleteService, useServices } from '@/hooks/queries/useServices';
import { formatDuration, formatPrice } from '@/types/service';
import type { Service } from '@/types/service';
import { getErrorMessage } from '@/lib/utils';

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const deleteService = useDeleteService();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteService.mutateAsync(deleting.id);
      toast.success('Услуга удалена');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Название',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.image_url}
                alt={row.original.name}
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-900/30">
                💉
              </div>
            )}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Цена',
        cell: ({ row }) => <span className="font-semibold">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: 'duration',
        header: 'Длительность',
        cell: ({ row }) => formatDuration(row.original.duration),
      },
      {
        accessorKey: 'is_active',
        header: 'Активность',
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge tone="emerald">Активна</Badge>
          ) : (
            <Badge tone="slate">Скрыта</Badge>
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
        title="Услуги"
        subtitle={services ? `Всего услуг: ${services.length}` : undefined}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Добавить услугу
          </Button>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          data={services ?? []}
          loading={isLoading}
          emptyTitle="Услуг пока нет"
          emptyDescription="Добавьте первую услугу клиники"
        />
      </Card>

      <ServiceFormModal open={createOpen} onClose={() => setCreateOpen(false)} service={null} />
      <ServiceFormModal open={Boolean(editing)} onClose={() => setEditing(null)} service={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Удалить услугу?"
        message={`Услуга «${deleting?.name ?? ''}» будет удалена. Исторические записи останутся без привязки к услуге.`}
        loading={deleteService.isPending}
      />
    </div>
  );
}
