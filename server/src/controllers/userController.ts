import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { User, UserRegistration, UserLogin, AuthResponse } from '../models/User';

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role }: UserRegistration = req.body;

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
      res.status(400).json({ message: 'کاربری با این ایمیل در سیستم وجود دارد' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role`,
      [name, email, hashedPassword, phone, role]
    );

    const user = result.rows[0];

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '30d' }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: UserLogin = req.body;

    // Check for user email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
      return;
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
      return;
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '30d' }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const result = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'کاربر یافت نشد' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'دسترسی غیر مجاز' });
      return;
    }

    const { name, email, phone, password } = req.body;

    // Check if email is already in use by another user
    if (email) {
      const emailExists = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (emailExists.rows.length > 0) {
        res.status(400).json({ message: 'این ایمیل توسط کاربر دیگری استفاده شده است' });
        return;
      }
    }

    // Prepare query
    let query = 'UPDATE users SET ';
    const updateValues: string[] = [];
    const queryParams: any[] = [];

    // Add parameters if they exist
    if (name) {
      updateValues.push(`name = $${updateValues.length + 1}`);
      queryParams.push(name);
    }

    if (email) {
      updateValues.push(`email = $${updateValues.length + 1}`);
      queryParams.push(email);
    }

    if (phone) {
      updateValues.push(`phone = $${updateValues.length + 1}`);
      queryParams.push(phone);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateValues.push(`password = $${updateValues.length + 1}`);
      queryParams.push(hashedPassword);
    }

    // Add updated_at
    updateValues.push(`updated_at = NOW()`);

    // Add WHERE clause
    query += `${updateValues.join(', ')} WHERE id = $${queryParams.length + 1} RETURNING id, name, email, phone, role`;
    queryParams.push(req.user.id);

    // Execute update
    const result = await pool.query(query, queryParams);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطای سرور' });
  }
};