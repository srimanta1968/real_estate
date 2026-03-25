import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Auth controller handling registration and login endpoints.
 */
export const AuthController = {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, first_name, last_name } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        return;
      }

      const result = await AuthService.register({ email, username, password, first_name, last_name });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error.message === 'Email already registered' || error.message === 'Username already taken') {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      console.error('Registration error:', error);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
        res.status(401).json({ success: false, error: error.message });
        return;
      }
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  },
};
