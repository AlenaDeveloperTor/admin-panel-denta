'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pushAPI } from '@/lib/api/push';
import type { PushHistoryItem, PushSendInput } from '@/types/push';

/** История рассылок */
export function usePushHistory() {
  return useQuery({
    queryKey: ['push', 'history'],
    queryFn: async () => {
      const res = await pushAPI.history();
      const data = Array.isArray(res.data) ? res.data : (res.data as { items?: PushHistoryItem[] })?.items ?? [];
      return data;
    },
  });
}

/** Статус задачи отправки. Пока task_id активен — опрашиваем каждые 2с */
export function usePushTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: ['push', 'task', taskId],
    queryFn: () => pushAPI.taskStatus(taskId as string).then((r) => r.data),
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const done = status === 'completed' || status === 'failed';
      return done ? false : 2000;
    },
  });
}

/**
 * Отправка push. all → POST /push/send-all; users → POST /push/send (patient_ids).
 * Для «по телефону» админка резолвит телефоны в patient_ids перед вызовом (lib/push-resolve).
 */
export function useSendPush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PushSendInput) => {
      if (input.target === 'all') {
        return pushAPI.sendAll({
          title: input.title,
          body: input.body,
          image_url: input.image_url,
          banner_id: input.banner_id,
        });
      }
      return pushAPI.send({
        title: input.title,
        body: input.body,
        image_url: input.image_url,
        banner_id: input.banner_id,
        patient_ids: input.patient_ids ?? [],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['push', 'history'] }),
  });
}
