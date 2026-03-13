import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { CashFlowController } from '../controllers/cashflow.controller';

interface CashFlowRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof CashFlowController[keyof typeof CashFlowController];
  middleware: Function[];
}

const routes: CashFlowRouteConfig[] = [
  { method: 'post', path: '/', handler: CashFlowController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: CashFlowController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: CashFlowController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: CashFlowController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: CashFlowController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
