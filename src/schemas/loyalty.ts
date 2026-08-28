import { z } from 'zod';

/** Схема ручного начисления/списания баллов */
export const adjustPointsSchema = z
  .object({
    amount: z.coerce.number({ invalid_type_error: 'Введите количество баллов' }),
    reason: z.string().min(3, 'Укажите причину (минимум 3 символа)'),
  })
  .superRefine((val, ctx) => {
    if (val.amount === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Количество баллов не может быть 0' });
    }
    if (Math.abs(val.amount) > 1_000_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Слишком большое значение' });
    }
  });

export type AdjustPointsFormValues = z.infer<typeof adjustPointsSchema>;
