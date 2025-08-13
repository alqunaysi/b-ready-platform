import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Express middleware to validate JWT tokens.
 *
 * The token must be provided in the Authorization header as a Bearer token.
 * If valid, the decoded payload will be attached to req.user.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }
  const token = parts[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT secret not configured' });
  }
  try {
    const decoded = jwt.verify(token, secret) as any;
    // Attach user info to request for downstream handlers
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}