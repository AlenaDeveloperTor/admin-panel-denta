import type { CreateServiceInput, Service, UpdateServiceInput } from '@/types/service';
import { api } from './client';

export const servicesAPI = {
  /** Список услуг */
  list: () => api.get<Service[]>('/services'),

  /** Детали услуги */
  getById: (id: string) => api.get<Service>(`/services/${id}`),

  /** Создать услугу */
  create: (input: CreateServiceInput) => api.post<Service>('/services', input),

  /** Обновить услугу */
  update: (id: string, input: UpdateServiceInput) => api.patch<Service>(`/services/${id}`, input),

  /** Удалить услугу */
  remove: (id: string) => api.delete(`/services/${id}`),
};
