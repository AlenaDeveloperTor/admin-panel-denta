import type { PushHistoryItem, PushSendInput, PushTaskStatus } from '@/types/push';
import { api } from './client';

/**
 * API push-рассылок (по контракту бэкенда, см. project_tasks.md §4.5).
 * - массовая: POST /admin/push/send-all
 * - персональная: POST /admin/push/send (по patient_ids)
 * Ответ: { task_id } → прогресс через GET /admin/push/task-status/{task_id}.
 */
export const pushAPI = {
  /** Массовая рассылка всем пациентам */
  sendAll: (input: { title: string; body: string; image_url?: string }) =>
    api.post<{ task_id?: string; success?: boolean }>('/push/send-all', input),

  /** Персональная/выборочная рассылка по id пациентов */
  send: (input: {
    title: string;
    body: string;
    image_url?: string;
    patient_ids: number[];
  }) => api.post<{ task_id?: string; success?: boolean }>('/push/send', input),

  /** История рассылок */
  history: () => api.get<PushHistoryItem[]>('/push/history'),

  /** Статус задачи отправки */
  taskStatus: (taskId: string) => api.get<PushTaskStatus>(`/push/task-status/${taskId}`),
};

export type { PushSendInput };
