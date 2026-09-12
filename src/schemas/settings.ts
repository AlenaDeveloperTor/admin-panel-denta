import { z } from 'zod';

const optionalPercent = z
  .union([z.literal(''), z.coerce.number().min(0, 'Не меньше 0').max(100, 'Не больше 100')])
  .optional();

const clinicTimezones = [
  'Europe/Kaliningrad', 'Europe/Moscow', 'Europe/Samara',
  'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk',
  'Asia/Barnaul', 'Asia/Krasnoyarsk', 'Asia/Irkutsk',
  'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka',
] as [string, ...string[]];

export const settingsSchema = z.object({
  name: z.string().min(2, 'Введите название клиники'),
  phone: z
    .string()
    .min(10, 'Введите телефон')
    .regex(/^[+\d][\d\s()-]{9,}$/, 'Некорректный телефон'),
  timezone: z.enum(clinicTimezones).refine((value) => value.length > 0, 'Выберите часовой пояс клиники'),
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
