import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * JWT authentication middleware.
 * Extracts and validates the Bearer token from the Authorization header.
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
