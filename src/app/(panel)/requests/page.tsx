'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { RequestsList } from '@/components/requests/requests-list';
import { RequestDetail } from '@/components/requests/request-detail';
import { useRequests } from '@/hooks/queries/useRequests';
import { markAllRequestsSeen } from '@/stores/useRequestsStore';
import type { Appointment } from '@/types/appointment';
import { formatNumber } from '@/lib/utils';

export default function RequestsPage() {
  const { data, isLoading, isFetching, refetch } = useRequests();
  const [selected, setSelected] = useState<Appointment | null>(null);

  const requests = data?.items ?? [];

  // При открытии страницы помечаем все текущие заявки прочитанными
  useEffect(() => {
    if (requests.length > 0) {
      markAllRequestsSeen(requests);
    }
  }, [requests]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Заявки на запись"
        subtitle={
          requests.length
            ? `Новых заявок: ${formatNumber(requests.length)}`
            : 'Заявки клиентов из приложения'
        }
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        }
      />

      <RequestsList
        requests={requests}
        loading={isLoading}
        onSelect={(request) => setSelected(request)}
      />

      <RequestDetail
        requestId={selected ? String(selected.id) : null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
