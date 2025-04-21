import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

dotenv.config();

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  console.log('Initializing database...');
  
  try {
    // Read schema SQL file
    const schemaFilePath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Execute schema creation
    await pool.query(schemaSql);
    console.log('Database schema created successfully.');
    
    // Check if admin user exists
    const adminResult = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@barber.com'"
    );
    
    // Create admin user if not exists
    if (adminResult.rows.length === 0) {
      // Hash the password (default: admin123)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['Admin', 'admin@barber.com', hashedPassword, '09123456789', 'admin']
      );
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
    
    // Add sample data
    await createSampleData();
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

async function createSampleData() {
  try {
    // Check if sample data already exists
    const shopsResult = await pool.query('SELECT * FROM shops LIMIT 1');
    
    if (shopsResult.rows.length > 0) {
      console.log('Sample data already exists. Skipping sample data creation.');
      return;
    }
    
    console.log('Creating sample data...');
    
    // Create a barber user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('barber123', salt);
    
    const barberResult = await pool.query(
      `INSERT INTO users (name, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['رضا محمدی', 'barber@example.com', hashedPassword, '09123456789', 'barber']
    );
    
    const barberId = barberResult.rows[0].id;
    
    // Create a customer user
    const customerResult = await pool.query(
      `INSERT INTO users (name, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['علی حسینی', 'customer@example.com', hashedPassword, '09123456788', 'customer']
    );
    
    // Create a shop
    const openingHours = {
      '0': { open: '09:00', close: '20:00', is_closed: true },
      '1': { open: '09:00', close: '20:00', is_closed: false },
      '2': { open: '09:00', close: '20:00', is_closed: false },
      '3': { open: '09:00', close: '20:00', is_closed: false },
      '4': { open: '09:00', close: '20:00', is_closed: false },
      '5': { open: '09:00', close: '20:00', is_closed: false },
      '6': { open: '09:00', close: '14:00', is_closed: false }
    };
    
    const shopResult = await pool.query(
      `INSERT INTO shops (
        name, description, address, phone, email, instagram, 
        website, logo_url, cover_image_url, opening_hours, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        'آرایشگاه مدرن',
        'آرایشگاه مردانه با بهترین خدمات',
        'تهران، خیابان ولیعصر، پلاک 123',
        '02112345678',
        'info@modernbarber.com',
        'modernbarber',
        'https://www.modernbarber.com',
        'https://example.com/logo.jpg',
        'https://example.com/cover.jpg',
        JSON.stringify(openingHours),
        barberId
      ]
    );
    
    const shopId = shopResult.rows[0].id;
    
    // Add barber to shop
    await pool.query(
      'INSERT INTO shop_barbers (shop_id, user_id) VALUES ($1, $2)',
      [shopId, barberId]
    );
    
    // Create services
    const services = [
      {
        name: 'اصلاح مو',
        description: 'کوتاه کردن مو با قیچی و ماشین اصلاح',
        price: 150000,
        duration: 30,
        image_url: 'https://example.com/haircut.jpg'
      },
      {
        name: 'اصلاح ریش',
        description: 'اصلاح و مرتب کردن ریش با تیغ و ماشین اصلاح',
        price: 100000,
        duration: 20,
        image_url: 'https://example.com/beard.jpg'
      },
      {
        name: 'اصلاح مو و ریش',
        description: 'ترکیب اصلاح مو و ریش',
        price: 200000,
        duration: 45,
        image_url: 'https://example.com/haircut-beard.jpg'
      }
    ];
    
    // Add services
    for (const service of services) {
      await pool.query(
        `INSERT INTO services (name, description, price, duration, shop_id, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          service.name,
          service.description,
          service.price,
          service.duration,
          shopId,
          service.image_url
        ]
      );
    }
    
    console.log('Sample data created successfully.');
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
}

// Run initialization
initDatabase(); 