import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { DataService } from './data.service';

interface UserRecord {
  id: string;
  email: string;
  username: string | null;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  oauth_provider: string | null;
  oauth_provider_id: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface OAuthProfile {
  provider: 'google' | 'linkedin';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface RegisterInput {
  email: string;
  username?: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  user: Omit<UserRecord, 'password_hash'>;
  token: string;
}

/**
 * Authentication service handling registration, login, and token management.
 * Uses DataService for all database operations.
 */
export const AuthService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<LoginResult> {
    try {
      const existing = await DataService.findOne<UserRecord>(
        'SELECT id FROM users WHERE email = $1',
        [input.email]
      );

      if (existing) {
        throw new Error('Email already registered');
      }

      if (input.username) {
        const existingUsername = await DataService.findOne<UserRecord>(
          'SELECT id FROM users WHERE username = $1',
          [input.username]
        );
        if (existingUsername) {
          throw new Error('Username already taken');
        }
      }

      const password_hash = await bcrypt.hash(input.password, config.bcryptRounds);

      const user = await DataService.insertOne<UserRecord>('users', {
        email: input.email,
        username: input.username || null,
        password_hash,
        first_name: input.first_name || null,
        last_name: input.last_name || null,
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: 24 * 60 * 60 }
      );

      const { password_hash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Email already registered' ||
        error.message === 'Username already taken'
      )) {
        throw error;
      }
      console.error('AuthService register error:', error);
      throw error;
    }
  },

  /**
   * Login with email and password, returns JWT token
   */
  async login(input: LoginInput): Promise<LoginResult> {
    try {
      const user = await DataService.findOne<UserRecord>(
        'SELECT * FROM users WHERE email = $1',
        [input.email]
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      const isValid = await bcrypt.compare(input.password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      await DataService.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const expiresInSeconds = 24 * 60 * 60; // 24 hours
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: expiresInSeconds }
      );

      const { password_hash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Invalid email or password' ||
        error.message === 'Account is deactivated'
      )) {
        throw error;
      }
      console.error('AuthService login error:', error);
      throw error;
    }
  },

  /**
   * Find or create a user from OAuth profile. Returns user + JWT token.
   */
  async findOrCreateOAuthUser(profile: OAuthProfile): Promise<LoginResult> {
    try {
      // Check if user exists with this OAuth provider + ID
      let user = await DataService.findOne<UserRecord>(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
        [profile.provider, profile.providerId]
      );

      if (!user) {
        // Check if user exists with same email
        user = await DataService.findOne<UserRecord>(
          'SELECT * FROM users WHERE email = $1',
          [profile.email]
        );

        if (user) {
          // Link existing account to OAuth provider
          const updated = await DataService.update<UserRecord>(
            'users',
            { oauth_provider: profile.provider, oauth_provider_id: profile.providerId },
            'id = $1',
            [user.id]
          );
          user = updated[0];
        } else {
          // Create new user (no password needed for OAuth)
          const randomHash = await bcrypt.hash(crypto.randomUUID(), 4);
          user = await DataService.insertOne<UserRecord>('users', {
            email: profile.email,
            password_hash: randomHash,
            first_name: profile.firstName || null,
            last_name: profile.lastName || null,
            oauth_provider: profile.provider,
            oauth_provider_id: profile.providerId,
            email_verified: true,
          });
        }
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      await DataService.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: 24 * 60 * 60 }
      );

      const { password_hash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      if (error instanceof Error && error.message === 'Account is deactivated') {
        throw error;
      }
      console.error('AuthService OAuth error:', error);
      throw error;
    }
  },

  /**
   * Verify a JWT token and return decoded payload
   */
  verifyToken(token: string): { userId: string; email: string; role: string } {
    return jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      role: string;
    };
  },
};

export default AuthService;
