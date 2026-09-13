export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url?: string;
  bg_color: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateBannerInput {
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url?: string;
  bg_color: string;
  is_active: boolean;
  sort_order: number;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;