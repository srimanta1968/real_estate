import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';

/**
 * Auth routes configuration.
 * API Definitions: tests/api_definitions/auth/register.json, tests/api_definitions/auth/login.json
 */

interface AuthRouteConfig {
  path: string;
  method: 'post' | 'get';
  handler: (req: Request, res: Response) => Promise<void>;
}

const authRoutes: AuthRouteConfig[] = [
  { path: '/register', method: 'post', handler: AuthController.register },
  { path: '/login', method: 'post', handler: AuthController.login },
];

const router: Router = Router();

authRoutes.forEach((route: AuthRouteConfig) => {
  router[route.method](route.path, (req: Request, res: Response) => route.handler(req, res));
});

export default router;
