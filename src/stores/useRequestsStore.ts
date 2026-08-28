'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment } from '@/types/appointment';

interface RequestsState {
  /** id уже просмотренных (открытых) заявок — для подсчёта непрочитанных */
  seenIds: string[];
  /** id заявок, которые сейчас есть на бэкенде (обновляет watcher) */
  latestIds: string[];
  /** Обновить актуальный список id заявок */
  setLatestIds: (ids: string[]) => void;
  /** Отметить заявки как просмотренные */
  markSeen: (ids: string[]) => void;
  /** Сбросить историю просмотра (при выходе) */
  resetSeen: () => void;
}

/**
 * Состояние «новых заявок» на запись.
 * Хранит id просмотренных заявок (persisted), чтобы показывать
 * бейдж непрочитанных в сайдбаре и toast о новых заявках.
 */
export const useRequestsStore = create<RequestsState>()(
  persist(
    (set) => ({
      seenIds: [],
      latestIds: [],
      setLatestIds: (ids) => set({ latestIds: ids }),
      markSeen: (ids) =>
        set((s) => ({ seenIds: Array.from(new Set([...s.seenIds, ...ids])) })),
      resetSeen: () => set({ seenIds: [], latestIds: [] }),
    }),
    { name: 'denta_requests_seen' },
  ),
);

/** Количество непрочитанных заявок (по текущему состоянию стора) */
export function selectUnreadCount(): number {
  const { seenIds, latestIds } = useRequestsStore.getState();
  const seen = new Set(seenIds);
  return latestIds.filter((id) => !seen.has(String(id))).length;
}

/** Отметить все текущие заявки прочитанными (вызывается при открытии страницы) */
export function markAllRequestsSeen(requests: Appointment[]): void {
  useRequestsStore.getState().markSeen(requests.map((r) => String(r.id)));
}

