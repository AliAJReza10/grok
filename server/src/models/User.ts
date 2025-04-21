export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'barber' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'barber' | 'admin';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface DecodedUser {
  id: number;
  role: string;
}

export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  token: string;
} 