export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Liquor {
  id: string;
  name: string;
  name_original: string | null;
  category: string;
  sub_category: string | null;
  country: string | null;
  region: string | null;
  producer: string | null;
  vintage: number | null;
  abv: number | null;
  price_range: string | null;
  description: string | null;
  aroma_options: string[];
  taste_options: string[];
  finish_options: string[];
  overall_review: string | null;
  food_pairing_options: string[];
  avg_rating: number | null;
  drinking_timing: string | null;
  image_url: string | null;
  created_at: string;
}

// AI 인식 결과 (DB 저장 전 — id, created_at 없음)
export type ProvisionalLiquor = Omit<Liquor, 'id' | 'created_at'>;

export interface TastingNote {
  id: string;
  user_id: string;
  liquor_id: string;
  photo_urls: string[];
  rating: number | null;
  aroma: string[];
  taste: string[];
  finish: string[];
  food_pairing: string[];
  drinking_timing: string | null;
  overall_notes: string | null;
  tasting_date: string;
  location: string | null;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
  // joined
  liquor?: Liquor;
}
