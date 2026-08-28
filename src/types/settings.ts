/** Настройки клиники (GET/PATCH /admin/settings) */
export interface ClinicSettings {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  work_hours?: string;
  about?: string;
  /** % от стоимости услуги, начисляемый баллами (справочно, применяет менеджер вручную) */
  accrual_percent?: number;
  /** % от стоимости, который можно покрыть баллами (справочно) */
  write_off_percent?: number;
}

export type UpdateSettingsInput = Partial<ClinicSettings>;
