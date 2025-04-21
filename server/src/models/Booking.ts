export interface Booking {
  id: number;
  user_id: number;
  barber_id: number;
  shop_id: number;
  service_id: number;
  booking_date: Date;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BookingCreation {
  user_id: number;
  barber_id: number;
  shop_id: number;
  service_id: number;
  booking_date: Date;
  start_time: string;
  end_time: string;
  total_price: number;
  notes?: string;
}

export interface BookingResponse extends Booking {
  user_name: string;
  barber_name: string;
  shop_name: string;
  service_name: string;
} 