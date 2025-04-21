import express from 'express';
import { 
  getServices, 
  getServiceById, 
  createService, 
  updateService,
  deleteService,
  getServicesByBarberId,
  getPopularServices
} from '../controllers/serviceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/popular', getPopularServices);
router.get('/barber/:id', getServicesByBarberId);
router.get('/:id', getServiceById);

// Protected routes
router.post('/', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.delete('/:id', authMiddleware, deleteService);

export default router; 