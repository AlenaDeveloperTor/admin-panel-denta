import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '@/types/appointment';

export const appointmentSchema = z
  .object({
    user_id: z.number().optional(),
    service_id: z.string().min(1, 'Выберите услугу'),
    appointment_datetime: z.string().min(1, 'Выберите дату и время'),
    comment: z.string().max(500, 'Не более 500 символов').optional().or(z.literal('')),
  })
  .refine((v) => v.user_id !== undefined && v.user_id > 0, {
    message: 'Выберите пациента',
    path: ['user_id'],
  });

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const appointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});
