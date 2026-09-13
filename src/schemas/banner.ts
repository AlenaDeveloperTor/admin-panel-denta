import { z } from 'zod';

export const bannerSchema = z.object({
  title: z.string().min(1, 'Укажите заголовок').max(120, 'Максимум 120 символов'),
  subtitle: z.string().max(240, 'Максимум 240 символов'),
  image_url: z.string().min(1, 'Загрузите изображение'),
  button_text: z.string().max(60, 'Максимум 60 символов'),
  button_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => value?.trim() || undefined),
  bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Используйте цвет в формате #RRGGBB'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0, 'Порядок не может быть отрицательным'),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;