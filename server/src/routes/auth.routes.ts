import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';

/**
 * Auth routes configuration.
 * API Definitions: tests/api_definitions/auth/register.json, tests/api_definitions/auth/login.json,
 *   tests/api_definitions/auth/google-oauth.json, tests/api_definitions/auth/linkedin-oauth.json
 */

// @governance-tracked — API definitions added: register, login, google-oauth, google-oauth-callback, linkedin-oauth, linkedin-oauth-callback
const router: Router = Router();

// Email/password auth
router.post('/register', (req: Request, res: Response) => AuthController.register(req, res));
router.post('/login', (req: Request, res: Response) => AuthController.login(req, res));

// Google OAuth
router.get('/google', (req: Request, res: Response) => OAuthController.googleRedirect(req, res));
router.get('/google/callback', (req: Request, res: Response) => OAuthController.googleCallback(req, res));

// LinkedIn OAuth
router.get('/linkedin', (req: Request, res: Response) => OAuthController.linkedinRedirect(req, res));
router.get('/linkedin/callback', (req: Request, res: Response) => OAuthController.linkedinCallback(req, res));

export default router;
