import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Admin role verification middleware.
 * Must be used AFTER authMiddleware — checks that the authenticated user has role 'admin'.
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin privileges required' });
    return;
  }

  next();
};
