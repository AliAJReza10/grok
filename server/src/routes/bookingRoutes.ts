import express from 'express';
import { 
  createBooking, 
  getBookingById, 
  getUserBookings,
  getShopBookings,
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Customer routes
router.post('/', authMiddleware, createBooking);
router.get('/user', authMiddleware, getUserBookings);
router.get('/:id', authMiddleware, getBookingById);

// Shop owner/barber routes
router.get('/shop/:id', authMiddleware, getShopBookings);
router.put('/:id/status', authMiddleware, updateBookingStatus);

// Admin routes
router.delete('/:id', authMiddleware, adminMiddleware, deleteBooking);

export default router;