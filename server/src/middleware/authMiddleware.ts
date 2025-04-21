import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { DecodedUser } from '../models/User';

// Add user property to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallbacksecret'
      ) as DecodedUser;

      // Set req.user from decoded token
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'توکن نامعتبر است' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'توکن ارائه نشده است' });
    return;
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }
};

export const shopOwnerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'توکن ارائه نشده است' });
      return;
    }

    const shopId = req.params.id;
    
    // Check if user is shop owner
    const result = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [shopId, req.user.id]
    );

    if (result.rows.length === 0 && req.user.role !== 'admin') {
      res.status(403).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};