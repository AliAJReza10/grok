import { Request, Response } from 'express';
import pool from '../config/db';
import { Shop, ShopCreation } from '../models/Shop';

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
export const getShops = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM shops ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get shop by ID
// @route   GET /api/shops/:id
// @access  Public
export const getShopById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const shopResult = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    
    if (shopResult.rows.length === 0) {
      res.status(404).json({ message: 'آرایشگاه یافت نشد' });
      return;
    }
    
    // Get barbers for this shop
    const barbersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone 
       FROM users u
       JOIN shop_barbers sb ON u.id = sb.user_id
       WHERE sb.shop_id = $1 AND u.role = 'barber'`,
      [id]
    );
    
    const shop = shopResult.rows[0];
    shop.barbers = barbersResult.rows;
    
    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Create new shop
// @route   POST /api/shops
// @access  Private (barber, admin)
export const createShop = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const {
      name,
      description,
      address,
      phone,
      email,
      instagram,
      website,
      logo_url,
      cover_image_url,
      opening_hours
    }: ShopCreation = req.body;
    
    // Create shop
    const result = await pool.query(
      `INSERT INTO shops (
        name, description, address, phone, email, instagram, website, 
        logo_url, cover_image_url, opening_hours, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name, 
        description, 
        address, 
        phone, 
        email, 
        instagram || null, 
        website || null, 
        logo_url || null, 
        cover_image_url || null, 
        JSON.stringify(opening_hours), 
        req.user.id
      ]
    );
    
    // Add creator as a barber to this shop if role is barber
    if (req.user.role === 'barber') {
      await pool.query(
        'INSERT INTO shop_barbers (shop_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, req.user.id]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (shop owner, admin)
export const updateShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if shop exists
    const shopExists = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    
    if (shopExists.rows.length === 0) {
      res.status(404).json({ message: 'آرایشگاه یافت نشد' });
      return;
    }
    
    // Check ownership if not admin
    if (req.user?.role !== 'admin' && shopExists.rows[0].owner_id !== req.user?.id) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }
    
    const {
      name,
      description,
      address,
      phone,
      email,
      instagram,
      website,
      logo_url,
      cover_image_url,
      opening_hours
    } = req.body;
    
    // Update shop
    const result = await pool.query(
      `UPDATE shops SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        address = COALESCE($3, address),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        instagram = COALESCE($6, instagram),
        website = COALESCE($7, website),
        logo_url = COALESCE($8, logo_url),
        cover_image_url = COALESCE($9, cover_image_url),
        opening_hours = COALESCE($10, opening_hours),
        updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        description,
        address,
        phone,
        email,
        instagram,
        website,
        logo_url,
        cover_image_url,
        opening_hours ? JSON.stringify(opening_hours) : null,
        id
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (admin only)
export const deleteShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if shop exists
    const shopExists = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    
    if (shopExists.rows.length === 0) {
      res.status(404).json({ message: 'آرایشگاه یافت نشد' });
      return;
    }
    
    // Delete shop
    await pool.query('DELETE FROM shops WHERE id = $1', [id]);
    
    res.json({ message: 'آرایشگاه با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get shop services
// @route   GET /api/shops/:id/services
// @access  Public
export const getShopServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if shop exists
    const shopExists = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    
    if (shopExists.rows.length === 0) {
      res.status(404).json({ message: 'آرایشگاه یافت نشد' });
      return;
    }
    
    // Get services
    const result = await pool.query(
      'SELECT * FROM services WHERE shop_id = $1 ORDER BY name',
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
}; 