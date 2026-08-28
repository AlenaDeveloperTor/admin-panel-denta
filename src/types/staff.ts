import type { AdminRole, AdminUser } from './auth';

/**
 * Сотрудник клиники (учётная запись в админ-панели).
 * В демо-режиме хранится локально в localStorage (до подключения бэкенда).
 * На прод-бэкенде пароль хранится только в виде хэша (модель admin_staff).
 */
export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  /** Временный пароль (демо/локально). На бэкенде — только хэш. */
  password: string;
  is_blocked: boolean;
  created_at: string;
  last_login_at?: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
};

/** Из сотрудника в AdminUser (для стора авторизации/шапки) */
export function toAdminUser(s: Pick<StaffMember, 'id' | 'name' | 'email' | 'role'>): AdminUser {
  return { id: s.id, name: s.name, email: s.email, role: s.role };
}
