import crypto from 'crypto';
import { Request, Response } from 'express';
import { config } from '../config/env';
import { AuthService } from '../services/auth.service';

const FRONTEND_URL = config.oauth.frontendUrl;

/**
 * OAuth controller handling Google and LinkedIn OAuth2 flows.
 * Uses authorization code flow with backend token exchange.
 */
export const OAuthController = {
  /**
   * GET /api/auth/google - Redirect to Google consent screen
   */
  googleRedirect(req: Request, res: Response): void {
    const { clientId, callbackUrl } = config.oauth.google;
    if (!clientId) {
      res.status(500).json({ success: false, error: 'Google OAuth not configured' });
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  },

  /**
   * GET /api/auth/google/callback - Handle Google OAuth callback
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=missing_code`);
        return;
      }

      const { clientId, clientSecret, callbackUrl } = config.oauth.google;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=token_exchange_failed`);
        return;
      }

      // Get user profile
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.email) {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=profile_fetch_failed`);
        return;
      }

      const result = await AuthService.findOrCreateOAuthUser({
        provider: 'google',
        providerId: profile.id,
        email: profile.email,
        firstName: profile.given_name,
        lastName: profile.family_name,
      });

      res.redirect(`${FRONTEND_URL}/auth/callback?token=${result.token}`);
    } catch (error: any) {
      console.error('Google OAuth callback error:', error);
      const msg = error.message === 'Account is deactivated' ? 'account_deactivated' : 'oauth_failed';
      res.redirect(`${FRONTEND_URL}/auth/callback?error=${msg}`);
    }
  },

  /**
   * GET /api/auth/linkedin - Redirect to LinkedIn consent screen
   */
  linkedinRedirect(req: Request, res: Response): void {
    const { clientId, callbackUrl } = config.oauth.linkedin;
    if (!clientId) {
      res.status(500).json({ success: false, error: 'LinkedIn OAuth not configured' });
      return;
    }

    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
      scope: 'openid profile email',
    });

    res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
  },

  /**
   * GET /api/auth/linkedin/callback - Handle LinkedIn OAuth callback
   */
  async linkedinCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=missing_code`);
        return;
      }

      const { clientId, clientSecret, callbackUrl } = config.oauth.linkedin;

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
      });

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=token_exchange_failed`);
        return;
      }

      // Get user profile via OpenID Connect userinfo
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.email) {
        res.redirect(`${FRONTEND_URL}/auth/callback?error=profile_fetch_failed`);
        return;
      }

      const result = await AuthService.findOrCreateOAuthUser({
        provider: 'linkedin',
        providerId: profile.sub,
        email: profile.email,
        firstName: profile.given_name,
        lastName: profile.family_name,
      });

      res.redirect(`${FRONTEND_URL}/auth/callback?token=${result.token}`);
    } catch (error: any) {
      console.error('LinkedIn OAuth callback error:', error);
      const msg = error.message === 'Account is deactivated' ? 'account_deactivated' : 'oauth_failed';
      res.redirect(`${FRONTEND_URL}/auth/callback?error=${msg}`);
    }
  },
};
