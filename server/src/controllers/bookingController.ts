import { Request, Response } from 'express';
import pool from '../config/db';
import { Booking, BookingCreation } from '../models/Booking';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (customer)
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const {
      barber_id,
      shop_id,
      service_id,
      booking_date,
      start_time,
      end_time,
      total_price,
      notes
    }: BookingCreation = req.body;

    // Check if barber is available at this time
    const barberAvailable = await checkBarberAvailability(
      barber_id,
      booking_date,
      start_time,
      end_time
    );

    if (!barberAvailable) {
      res.status(400).json({ message: 'آرایشگر در این زمان در دسترس نیست' });
      return;
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (
        user_id, barber_id, shop_id, service_id, booking_date, 
        start_time, end_time, status, total_price, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.user.id,
        barber_id,
        shop_id,
        service_id,
        booking_date,
        start_time,
        end_time,
        'pending',
        total_price,
        notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*, u.name AS user_name, 
        bu.name AS barber_name, s.name AS shop_name,
        sv.name AS service_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN users bu ON b.barber_id = bu.id
       JOIN shops s ON b.shop_id = s.id
       JOIN services sv ON b.service_id = sv.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'رزرو یافت نشد' });
      return;
    }

    const booking = result.rows[0];

    // Check if user is authorized to view this booking
    if (
      req.user.id !== booking.user_id &&
      req.user.id !== booking.barber_id &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/user
// @access  Private
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const { status } = req.query;

    let query = `
      SELECT b.*, u.name AS user_name, 
        bu.name AS barber_name, s.name AS shop_name,
        sv.name AS service_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN users bu ON b.barber_id = bu.id
      JOIN shops s ON b.shop_id = s.id
      JOIN services sv ON b.service_id = sv.id
      WHERE b.user_id = $1
    `;
    
    const queryParams: any[] = [req.user.id];

    if (status) {
      query += ` AND b.status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY b.booking_date DESC, b.start_time ASC`;

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get shop bookings
// @route   GET /api/bookings/shop/:id
// @access  Private (shop owner, admin)
export const getShopBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const { id } = req.params;
    const { date, barber_id, status } = req.query;

    // Check if user is authorized to view shop bookings
    const shopOwnerResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    );

    const isBarberInShop = await pool.query(
      'SELECT * FROM shop_barbers WHERE shop_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (
      shopOwnerResult.rows.length === 0 &&
      isBarberInShop.rows.length === 0 &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    let query = `
      SELECT b.*, u.name AS user_name, u.phone AS user_phone,
        bu.name AS barber_name, s.name AS shop_name,
        sv.name AS service_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN users bu ON b.barber_id = bu.id
      JOIN shops s ON b.shop_id = s.id
      JOIN services sv ON b.service_id = sv.id
      WHERE b.shop_id = $1
    `;
    
    const queryParams: any[] = [id];
    let paramIndex = 2;

    if (date) {
      query += ` AND b.booking_date = $${paramIndex}`;
      queryParams.push(date);
      paramIndex++;
    }

    if (barber_id) {
      query += ` AND b.barber_id = $${paramIndex}`;
      queryParams.push(barber_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      queryParams.push(status);
    }

    query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (shop owner, barber, admin)
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if booking exists
    const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);

    if (bookingResult.rows.length === 0) {
      res.status(404).json({ message: 'رزرو یافت نشد' });
      return;
    }

    const booking = bookingResult.rows[0];

    // Check if user is authorized to update this booking
    const shopOwnerResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [booking.shop_id, req.user.id]
    );

    if (
      req.user.id !== booking.barber_id &&
      shopOwnerResult.rows.length === 0 &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    // Update booking status
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (admin)
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if booking exists
    const bookingExists = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);

    if (bookingExists.rows.length === 0) {
      res.status(404).json({ message: 'رزرو یافت نشد' });
      return;
    }

    // Delete booking
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

    res.json({ message: 'رزرو با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// Helper function to check barber availability
const checkBarberAvailability = async (
  barber_id: number,
  booking_date: Date,
  start_time: string,
  end_time: string
): Promise<boolean> => {
  const result = await pool.query(
    `SELECT * FROM bookings 
     WHERE barber_id = $1 
     AND booking_date = $2
     AND status != 'cancelled'
     AND (
       (start_time <= $3 AND end_time > $3) OR
       (start_time < $4 AND end_time >= $4) OR
       (start_time >= $3 AND end_time <= $4)
     )`,
    [barber_id, booking_date, start_time, end_time]
  );

  return result.rows.length === 0;
}; 