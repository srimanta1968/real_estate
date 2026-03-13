import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { PropertyController } from '../controllers/property.controller';

interface PropertyRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof PropertyController[keyof typeof PropertyController];
  middleware: Function[];
}

const routes: PropertyRouteConfig[] = [
  { method: 'post', path: '/', handler: PropertyController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/', handler: PropertyController.getAll, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: PropertyController.getById, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: PropertyController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: PropertyController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
