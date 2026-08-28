/** Пациент клиники (соответствует типу из мобильного приложения) */
export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  birth_date?: string;
  is_active?: boolean;
  email?: string;
  loyalty_balance: number;
  created_at?: string;
  avatar_url?: string;
}

export interface CreateUserInput {
  first_name: string;
  last_name: string;
  patronymic?: string;
  birth_date?: string;
  phone: string;
  email?: string;
}

export type UpdateUserInput = Partial<CreateUserInput>;

/** Полное имя пациента "Иванов И." */
export function fullName(user: Pick<User, 'first_name' | 'last_name'> | null | undefined): string {
  if (!user) return '—';
  const first = user.first_name?.trim() ?? '';
  const last = user.last_name?.trim() ?? '';
  const initial = first ? `${first[0].toUpperCase()}.` : '';
  return [last, initial].filter(Boolean).join(' ') || '—';
}

/** Короткий телефон для отображения */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '—';
  return phone;
}
