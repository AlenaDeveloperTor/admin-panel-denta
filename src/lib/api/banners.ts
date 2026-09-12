import type { Banner, CreateBannerInput, UpdateBannerInput } from '@/types/banner';
import { api } from './client';

export const bannersAPI = {
  list: (isActive?: boolean) =>
    api.get<Banner[]>('/banners', { params: isActive === undefined ? undefined : { is_active: isActive } }),
  getById: (id: number) => api.get<Banner>(`/banners/${id}`),
  create: (input: CreateBannerInput) => api.post<Banner>('/banners', input),
  update: (id: number, input: UpdateBannerInput) => api.patch<Banner>(`/banners/${id}`, input),
  remove: (id: number) => api.delete(`/banners/${id}`),
};