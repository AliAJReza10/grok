export interface Shop {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  instagram?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  opening_hours: {
    [key: string]: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShopCreation {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  instagram?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  opening_hours: {
    [key: string]: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };
  owner_id: number;
} 