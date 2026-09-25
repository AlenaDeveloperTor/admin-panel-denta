import { api } from '@/lib/api/client';

/**
 * Загрузка изображения на сервер: multipart/form-data -> POST /admin/upload.
 * Бэкенд возвращает { url: string }.
 * ВАЖНО: Content-Type НЕ устанавливаем вручную — браузер сам добавит boundary.
 */
export async function uploadImage(file: File, folder = 'banners'): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await api.post<{ url?: string; image_url?: string }>('/upload', form, {
    timeout: 60000,
    params: { folder },
    headers: { 'Content-Type': undefined },
  });

  const url = res.data?.url ?? res.data?.image_url;
  if (!url) throw new Error('Сервер не вернул URL изображения');
  return url;
}
