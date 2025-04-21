import express, { Request, Response, NextFunction } from 'express';
import { 
  getShops, 
  getShopById, 
  createShop, 
  updateShop,
  deleteShop,
  getShopServices
} from '../controllers/shopController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', (req: Request, res: Response) => getShops(req, res));
router.get('/:id', (req: Request, res: Response) => getShopById(req, res));
router.get('/:id/services', (req: Request, res: Response) => getShopServices(req, res));

// Protected routes (require shop owner or admin)
router.post('/', authMiddleware, (req: Request, res: Response) => createShop(req, res));
router.put('/:id', authMiddleware, (req: Request, res: Response) => updateShop(req, res));
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => deleteShop(req, res));

export default router;