'use client';

import { Clock } from 'lucide-react';

/**
 * Предпросмотр push-уведомления в виде мокапа уведомления на телефоне.
 * Обновляется в реальном времени при заполнении формы.
 */
export function PushPreview({
  title,
  body,
  imageUrl,
}: {
  title: string;
  body: string;
  imageUrl?: string;
}) {
  const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-75 overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-50 shadow-lg dark:bg-slate-800">
        {/* Полоска экрана */}
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-[10px] font-semibold text-white">
          <span>{now}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        {/* Уведомление */}
        <div className="p-3">
          <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 dark:shadow-slate-700/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              🦷
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {title || 'Заголовок уведомления'}
                </p>
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  сейчас
                </span>
              </div>
              <div className="mt-1 flex gap-2">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : null}
                <p className="line-clamp-3 text-xs leading-snug text-slate-600 dark:text-slate-300">
                  {body || 'Текст уведомления появится здесь…'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
