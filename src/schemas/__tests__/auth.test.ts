import { describe, it, expect } from 'vitest';
import { loginSchema } from '../auth';

describe('Валидация схемы авторизации (loginSchema)', () => {
  it('успешно валидирует корректный email и пароль', () => {
    const validData = {
      email: 'admin@dental-clinic.ru',
      password: 'SuperSecretPassword123',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe(validData.email);
    }
  });

  it('выдает ошибку при некорректном формате email', () => {
    const invalidData = {
      email: 'admin-not-an-email',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Некорректный email');
    }
  });

  it('выдает ошибку при пустом email', () => {
    const invalidData = {
      email: '',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
