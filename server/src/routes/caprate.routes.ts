import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { CapRateController } from '../controllers/caprate.controller';

interface CapRateRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof CapRateController[keyof typeof CapRateController];
  middleware: Function[];
}

const routes: CapRateRouteConfig[] = [
  { method: 'post', path: '/', handler: CapRateController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: CapRateController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: CapRateController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: CapRateController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: CapRateController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
