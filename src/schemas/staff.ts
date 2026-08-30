import { z } from 'zod';

/** Схема формы создания/редактирования сотрудника */
export const staffSchema = z.object({
  name: z.string().min(2, 'Укажите ФИО (минимум 2 символа)'),
  email: z.string().email('Некорректный email'),
  role: z.enum(['admin', 'manager']),
  password: z.string(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
