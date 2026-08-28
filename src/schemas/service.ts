import { z } from 'zod';
import { DURATION_OPTIONS } from '@/types/service';

export const serviceSchema = z.object({
  name: z.string().min(3, 'Название — минимум 3 символа'),
  description: z.string().max(2000, 'Не более 2000 символов').optional().or(z.literal('')),
  price: z.coerce.number().positive('Цена должна быть больше 0').max(10_000_000, 'Слишком большая цена'),
  duration: z.coerce
    .number()
    .refine((v) => DURATION_OPTIONS.includes(v as (typeof DURATION_OPTIONS)[number]), 'Некорректная длительность'),
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
