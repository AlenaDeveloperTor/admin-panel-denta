/** Целевая аудитория push-рассылки (UI). Для API бэкенда: all | users */
export type PushTarget = 'all' | 'users' | 'phones';
export type PushCategory = 'promo' | 'system' | 'info';

/** Статус рассылки в истории */
export type PushHistoryStatus = 'pending' | 'in_progress' | 'sent' | 'partial' | 'failed';

/** Тело запроса на отправку push */
export interface PushSendInput {
  /** Заголовок уведомления */
  title: string;
  /** Текст уведомления */
  body: string;
  category?: PushCategory;
  /** URL изображения (опционально) */
  image_url?: string;
  /** all — всем пациентам (send-all), users — по списку patient_ids (send) */
  target: PushTarget;
  /** id пациентов для target='users' (персональная рассылка) */
  patient_ids?: number[];
}

/** Запись в истории рассылок (GET /admin/push/history) */
export interface PushHistoryItem {
  id: string | number;
  title: string;
  body?: string;
  category?: PushCategory;
  image_url?: string;
  target: 'all' | 'users';
  patient_ids?: number[];
  /** Всего получателей в рассылке */
  recipients_count: number;
  /** Сколько отправлено в Expo (при активной рассылке) */
  accept_count?: number;
  /** Сколько реально доставлено (после завершения) */
  sent_count?: number;
  status: PushHistoryStatus;
  /** id задачи отправки для опроса прогресса */
  task_id?: string;
  created_at: string;
}

/** Статус задачи отправки (GET /admin/push/task-status/{task_id}) */
export interface PushTaskStatus {
  task_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'sent' | 'partial' | 'failed';
  total: number;
  /** Сколько отправлено в API Expo (сразу после отправки) */
  accept: number;
  /** Сколько реально доставлено (заполняется асинхронно через 15 сек) */
  sent: number;
  failed: number;
  /** 0..100 */
  progress: number;
}

/** Черновик рассылки (хранится локально в localStorage) */
export interface PushDraft {
  id: string;
  title: string;
  body: string;
  category: PushCategory;
  image_url?: string;
  target: PushTarget;
  phones: string[];
  patient_ids: number[];
  saved_at: string;
}

/** Константы статусов рассылки для UI */
export const PUSH_STATUS_LABELS: Record<PushHistoryStatus, string> = {
  pending: 'В очереди',
  in_progress: 'Отправляется',
  sent: 'Доставлено',
  partial: 'Частично',
  failed: 'Ошибка',
};
