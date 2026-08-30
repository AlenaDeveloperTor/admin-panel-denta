import type { AdminRole, AdminUser } from './auth';

/**
 * Сотрудник клиники (учётная запись в админ-панели).
 * Соответствует модели admin_staff на бэкенде.
 * Пароль не возвращается бэкендом — передаётся только при создании/редактировании.
 */
export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  avatar_url?: string;
  is_blocked: boolean;
  created_at: string;
  last_login_at?: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
};

/** Из сотрудника в AdminUser (для стора авторизации/шапки) */
export function toAdminUser(s: Pick<StaffMember, 'id' | 'name' | 'email' | 'role' | 'avatar_url'>): AdminUser {
  return { id: s.id, name: s.name, email: s.email, role: s.role, avatar_url: s.avatar_url };
}
