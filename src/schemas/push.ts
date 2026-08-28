import { z } from 'zod';

/** Схема формы составления push-уведомления */
export const pushSchema = z.object({
  title: z.string().min(3, 'Заголовок — минимум 3 символа').max(80, 'Заголовок — максимум 80 символов'),
  body: z.string().min(3, 'Текст — минимум 3 символа').max(500, 'Текст — максимум 500 символов'),
  deep_link: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  image_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
});

export type PushFormValues = z.infer<typeof pushSchema>;

/** Валидация телефона в простом виде (допускаем цифры, +, пробелы, скобки, дефисы) */
export function isValidPushPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** Нормализация телефона для отправки на бэкенд: +79991234567 */
export function normalizePushPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  return `+${digits}`;
}
