/** Обёртка ответа API */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Пагинированный ответ API. Бэкенд может отдавать `per_page` или `limit`. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page?: number;
  limit?: number;
}

/** Параметры пагинации/поиска, которые отправляются на бэкенд (по ТЗ: page + limit) */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Нормализованный пагинированный результат после обработки ответа */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
