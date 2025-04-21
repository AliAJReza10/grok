import { Request, Response } from 'express';
import pool from '../config/db';
import { Service, ServiceCreation } from '../models/Service';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'سرویس یافت نشد' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private (shop owner, barber, admin)
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const {
      name,
      description,
      price,
      duration,
      shop_id,
      image_url
    }: ServiceCreation = req.body;
    
    // Check if user is authorized to add services to this shop
    const shopOwnerResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [shop_id, req.user.id]
    );
    
    const isBarberInShop = await pool.query(
      'SELECT * FROM shop_barbers WHERE shop_id = $1 AND user_id = $2',
      [shop_id, req.user.id]
    );
    
    if (
      shopOwnerResult.rows.length === 0 &&
      isBarberInShop.rows.length === 0 &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    // Create service
    const result = await pool.query(
      `INSERT INTO services (name, description, price, duration, shop_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, duration, shop_id, image_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (shop owner, barber, admin)
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const { id } = req.params;
    
    // Get service details including shop_id
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (serviceResult.rows.length === 0) {
      res.status(404).json({ message: 'سرویس یافت نشد' });
      return;
    }
    
    const service = serviceResult.rows[0];
    
    // Check if user is authorized to update services for this shop
    const shopOwnerResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [service.shop_id, req.user.id]
    );
    
    const isBarberInShop = await pool.query(
      'SELECT * FROM shop_barbers WHERE shop_id = $1 AND user_id = $2',
      [service.shop_id, req.user.id]
    );
    
    if (
      shopOwnerResult.rows.length === 0 &&
      isBarberInShop.rows.length === 0 &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const { name, description, price, duration, image_url } = req.body;
    
    // Update service
    const result = await pool.query(
      `UPDATE services SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        duration = COALESCE($4, duration),
        image_url = COALESCE($5, image_url),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description, price, duration, image_url, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (shop owner, admin)
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const { id } = req.params;
    
    // Get service details including shop_id
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    
    if (serviceResult.rows.length === 0) {
      res.status(404).json({ message: 'سرویس یافت نشد' });
      return;
    }
    
    const service = serviceResult.rows[0];
    
    // Check if user is authorized to delete services for this shop
    const shopOwnerResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [service.shop_id, req.user.id]
    );
    
    if (shopOwnerResult.rows.length === 0 && req.user.role !== 'admin') {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    // Delete service
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    
    res.json({ message: 'سرویس با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get services by barber ID
// @route   GET /api/services/barber/:id
// @access  Public
export const getServicesByBarberId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if barber exists
    const barberExists = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'barber'",
      [id]
    );
    
    if (barberExists.rows.length === 0) {
      res.status(404).json({ message: 'آرایشگر یافت نشد' });
      return;
    }
    
    // Get shops where barber works
    const shopResult = await pool.query(
      `SELECT s.* FROM shops s
       JOIN shop_barbers sb ON s.id = sb.shop_id
       WHERE sb.user_id = $1`,
      [id]
    );
    
    if (shopResult.rows.length === 0) {
      res.json([]);
      return;
    }
    
    // Get all services from these shops
    const shopIds = shopResult.rows.map(shop => shop.id);
    const placeholders = shopIds.map((_, index) => `$${index + 1}`).join(', ');
    
    const servicesResult = await pool.query(
      `SELECT s.*, sh.name as shop_name 
       FROM services s
       JOIN shops sh ON s.shop_id = sh.id
       WHERE s.shop_id IN (${placeholders})
       ORDER BY s.shop_id, s.name`,
      shopIds
    );
    
    res.json(servicesResult.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get most popular services
// @route   GET /api/services/popular
// @access  Public
export const getPopularServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT s.*, COUNT(b.id) as booking_count, sh.name as shop_name 
       FROM services s
       JOIN shops sh ON s.shop_id = sh.id
       LEFT JOIN bookings b ON s.id = b.service_id
       GROUP BY s.id, sh.name
       ORDER BY booking_count DESC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
}; 