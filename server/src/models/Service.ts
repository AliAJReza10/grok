export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  shop_id: number;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceCreation {
  name: string;
  description: string;
  price: number;
  duration: number;
  shop_id: number;
  image_url?: string;
} 