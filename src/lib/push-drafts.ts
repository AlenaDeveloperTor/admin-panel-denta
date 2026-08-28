import type { PushDraft } from '@/types/push';

/**
 * Черновики push-рассылок хранятся локально в localStorage
 * (бэкенд-эндпоинта для черновиков нет). Позволяют «подготовить»
 * рассылку заранее и отправить позже.
 */
const STORAGE_KEY = 'denta_push_drafts';

export function getPushDrafts(): PushDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePushDraft(draft: PushDraft): PushDraft[] {
  const drafts = getPushDrafts();
  const next = [...drafts.filter((d) => d.id !== draft.id), draft];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage может быть недоступен (например, приватный режим)
  }
  return next;
}

export function deletePushDraft(id: string): PushDraft[] {
  const next = getPushDrafts().filter((d) => d.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
