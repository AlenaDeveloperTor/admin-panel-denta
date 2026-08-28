/** Услуга клиники (соответствует типу из мобильного приложения) */
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Длительность в минутах */
  duration: number;
  image_url: string;
  is_active: boolean;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration: number;
  image_url?: string;
  is_active: boolean;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

/** Варианты длительности в форме */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }
  return `${minutes} мин`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}
