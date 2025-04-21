import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Alireza1234',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'barber_shop',
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
}; 