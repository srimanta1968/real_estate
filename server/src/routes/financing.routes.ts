import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { FinancingController } from '../controllers/financing.controller';

interface FinancingRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof FinancingController[keyof typeof FinancingController];
  middleware: Function[];
}

const routes: FinancingRouteConfig[] = [
  { method: 'post', path: '/', handler: FinancingController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: FinancingController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: FinancingController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: FinancingController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: FinancingController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
