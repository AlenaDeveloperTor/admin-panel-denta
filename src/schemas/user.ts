import { z } from 'zod';

export const userSchema = z.object({
  first_name: z.string().min(1, 'Введите имя'),
  last_name: z.string().min(1, 'Введите фамилию'),
  patronymic: z.string().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Введите телефон')
    .regex(/^[+\d][\d\s()-]{9,}$/, 'Некорректный телефон'),
  email: z
    .union([z.literal(''), z.string().email('Некорректный email')])
    .optional()
    .or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userSchema>;
