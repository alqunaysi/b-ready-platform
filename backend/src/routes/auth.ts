import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user. Requires email and password in the request body.
 * Returns a JWT on successful registration.
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    // Check if the email already exists
    const existing = await query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    // Insert user
    const inserted = await query<{ id: number }>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );
    const userId = inserted[0].id;
    // Generate JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    const token = jwt.sign({ id: userId, email }, secret, { expiresIn: '12h' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user by email and password.
 * Returns a JWT on successful login.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const users = await query<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    const token = jwt.sign({ id: user.id, email }, secret, { expiresIn: '12h' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

export default router;