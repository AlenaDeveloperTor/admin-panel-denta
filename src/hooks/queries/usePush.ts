'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pushAPI } from '@/lib/api/push';
import type { PushHistoryItem, PushSendInput } from '@/types/push';

/** История рассылок с серверной пагинацией */
export function usePushHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['push', 'history', page, limit],
    queryFn: () => pushAPI.history(page, limit).then((r) => r.data),
    placeholderData: keepPreviousData,
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
        });
      }
      return pushAPI.send({
        title: input.title,
        body: input.body,
        image_url: input.image_url,
        patient_ids: input.patient_ids ?? [],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['push', 'history'] }),
  });
}
