import { z } from 'zod';

const optionalPercent = z
  .union([z.literal(''), z.coerce.number().min(0, 'Не меньше 0').max(100, 'Не больше 100')])
  .optional();

export const settingsSchema = z.object({
  name: z.string().min(2, 'Введите название клиники'),
  phone: z
    .string()
    .min(10, 'Введите телефон')
    .regex(/^[+\d][\d\s()-]{9,}$/, 'Некорректный телефон'),
  email: z
    .union([z.literal(''), z.string().email('Некорректный email')])
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  work_hours: z.string().optional().or(z.literal('')),
  about: z.string().max(2000, 'Не более 2000 символов').optional().or(z.literal('')),
  accrual_percent: optionalPercent,
  write_off_percent: optionalPercent,
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
