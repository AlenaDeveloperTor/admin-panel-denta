export type AdminRole = 'admin' | 'manager';

/** Администратор/сотрудник клиники (из JWT / /admin/auth/me) */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user?: AdminUser;
}

/** Запись из истории входов/выходов (обязательное требование ТЗ §1.2) */
export interface SessionRecord {
  id: string;
  user_email: string;
  user_name?: string;
  action: 'login' | 'logout';
  ip?: string;
  user_agent?: string;
  created_at: string;
}
