'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRequests } from '@/hooks/queries/useRequests';
import { useRequestsStore } from '@/stores/useRequestsStore';
import { appointmentDate, appointmentTime } from '@/types/appointment';
import { fullName } from '@/types/user';

/**
 * Фоновый наблюдатель за новыми заявками на запись.
 * Монтируется в оболочке (Shell), опрашивает бэкенд каждые 30 секунд,
 * показывает toast о новых заявках и держит актуальный список id в сторе
 * (для бейджа непрочитанных в сайдбаре).
 */
export function RequestsWatcher() {
  const { data } = useRequests();
  const setLatestIds = useRequestsStore((s) => s.setLatestIds);
  const seenIdsRef = useRef<string[]>(useRequestsStore.getState().seenIds);
  const knownIdsRef = useRef<Set<string>>(new Set(useRequestsStore.getState().seenIds));

  useEffect(() => {
    const requests = data?.items ?? [];
    const ids = requests.map((r) => String(r.id));
    setLatestIds(ids);

    // Новая заявка = id нет в известных ранее
    const fresh = requests.filter((r) => !knownIdsRef.current.has(String(r.id)));
    if (fresh.length > 0) {
      fresh.slice(0, 3).forEach((r) => {
        const name = fullName(r.patient);
        toast(`Новая заявка на запись${name !== '—' ? ` от ${name}` : ''}`, {
          description: `${r.service?.name ?? 'Услуга'}${
            r.appointment_datetime ? ` · ${appointmentDate(r)} ${appointmentTime(r)}` : ''
          }`,
          action: {
            label: 'Открыть',
            onClick: () => {
              window.location.href = '/requests';
            },
          },
        });
      });
      // Обновляем известные id
      ids.forEach((id) => knownIdsRef.current.add(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, setLatestIds]);

  // Синхронизируем ref при первом изменении seenIds извне
  useEffect(() => {
    const unsub = useRequestsStore.subscribe((state, prev) => {
      if (state.seenIds.length !== prev.seenIds.length) {
        seenIdsRef.current = state.seenIds;
        state.seenIds.forEach((id) => knownIdsRef.current.add(id));
      }
    });
    return unsub;
  }, []);

  return null;
}
