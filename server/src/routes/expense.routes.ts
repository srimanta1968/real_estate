import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ExpenseController } from '../controllers/expense.controller';

interface ExpenseRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof ExpenseController[keyof typeof ExpenseController];
  middleware: Function[];
}

const routes: ExpenseRouteConfig[] = [
  { method: 'post', path: '/', handler: ExpenseController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: ExpenseController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: ExpenseController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: ExpenseController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: ExpenseController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
