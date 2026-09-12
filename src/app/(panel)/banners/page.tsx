'use client';

import { useMemo, useState } from 'react';
import { Image, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BannerFormModal } from '@/components/banners/banner-form-modal';
import { useBanners, useDeleteBanner } from '@/hooks/queries/useBanners';
import type { Banner } from '@/types/banner';
import { getErrorMessage } from '@/lib/utils';

export default function BannersPage() {
  const { data: banners, isLoading } = useBanners();
  const deleteBanner = useDeleteBanner();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteBanner.mutateAsync(deleting.id);
      toast.success('Баннер удалён');
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить баннер'));
    }
  };

  const columns = useMemo<ColumnDef<Banner>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Баннер',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.image_url} alt="" className="h-12 w-20 rounded-lg object-cover" />
          ) : <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><Image className="h-5 w-5 text-slate-400" /></div>}
          <div className="min-w-0"><p className="font-medium">{row.original.title}</p><p className="max-w-xs truncate text-xs text-slate-400">{row.original.subtitle || 'Без подзаголовка'}</p></div>
        </div>
      ),
    },
    { accessorKey: 'button_text', header: 'Кнопка', cell: ({ row }) => row.original.button_text || '—' },
    { accessorKey: 'sort_order', header: 'Порядок', cell: ({ row }) => row.original.sort_order ?? 0 },
    {
      accessorKey: 'is_active', header: 'Статус',
      cell: ({ row }) => row.original.is_active === false ? <Badge tone="slate">Скрыт</Badge> : <Badge tone="emerald">Активен</Badge>,
    },
    {
      id: 'actions', header: 'Действия',
      cell: ({ row }) => <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setEditing(row.original)} aria-label="Редактировать"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" onClick={() => setDeleting(row.original)} aria-label="Удалить"><Trash2 className="h-4 w-4" /></Button>
      </div>,
    },
  ], []);

  return <div className="space-y-5">
    <PageHeader title="Баннеры" subtitle={banners ? `Всего баннеров: ${banners.length}` : undefined} actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Добавить баннер</Button>} />
    <Card><DataTable columns={columns} data={banners ?? []} loading={isLoading} emptyTitle="Баннеров пока нет" emptyDescription="Создайте первый баннер для мобильного приложения" /></Card>
    <BannerFormModal open={createOpen} onClose={() => setCreateOpen(false)} banner={null} />
    <BannerFormModal open={Boolean(editing)} onClose={() => setEditing(null)} banner={editing} />
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Удалить баннер?" message={`Баннер «${deleting?.title ?? ''}» будет удалён.`} loading={deleteBanner.isPending} />
  </div>;
}