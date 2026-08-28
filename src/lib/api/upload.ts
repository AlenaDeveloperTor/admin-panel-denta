import axios from 'axios';

/**
 * Загрузка изображения на сервер: multipart/form-data → POST /admin/upload.
 * Бэкенд возвращает { url } или { image_url }.
 */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await axios.post<{ url?: string; image_url?: string }>('/admin-api/upload', form, {
    withCredentials: true,
    timeout: 60000,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const url = res.data?.url ?? res.data?.image_url;
  if (!url) throw new Error('Сервер не вернул URL изображения');
  return url;
}
