import type { ClinicSettings, UpdateSettingsInput } from '@/types/settings';
import { api } from './client';

export const settingsAPI = {
  /** Настройки клиники */
  get: () => api.get<ClinicSettings>('/settings'),

  /** Обновить настройки клиники */
  update: (input: UpdateSettingsInput) => api.patch<ClinicSettings>('/settings', input),
};
