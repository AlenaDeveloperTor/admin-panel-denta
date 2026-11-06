import { describe, it, expect } from 'vitest';
import { appointmentSchema, appointmentStatusSchema } from '../appointment';

describe('Валидация схемы записи (appointmentSchema)', () => {
  it('успешно валидирует корректную форму записи', () => {
    const validData = {
      service_id: 'srv_123',
      appointment_datetime: '2026-12-01T10:00:00.000Z',
      comment: 'Первичный осмотр и консультация',
    };

    const result = appointmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('отклоняет запись без выбранной услуги', () => {
    const invalidData = {
      service_id: '',
      appointment_datetime: '2026-12-01T10:00:00.000Z',
    };

    const result = appointmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Выберите услугу');
    }
  });

  it('отклоняет слишком длинный комментарий (>500 символов)', () => {
    const invalidData = {
      service_id: 'srv_123',
      appointment_datetime: '2026-12-01T10:00:00.000Z',
      comment: 'a'.repeat(501),
    };

    const result = appointmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Валидация статусов записи (appointmentStatusSchema)', () => {
  it('принимает допустимые статусы', () => {
    expect(appointmentStatusSchema.safeParse({ status: 'created' }).success).toBe(true);
    expect(appointmentStatusSchema.safeParse({ status: 'confirmed' }).success).toBe(true);
    expect(appointmentStatusSchema.safeParse({ status: 'completed' }).success).toBe(true);
    expect(appointmentStatusSchema.safeParse({ status: 'cancelled' }).success).toBe(true);
  });

  it('отклоняет неизвестный статус', () => {
    const result = appointmentStatusSchema.safeParse({ status: 'unknown_status' });
    expect(result.success).toBe(false);
  });
});
