import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { IrrController } from '../controllers/irr.controller';

interface IrrRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof IrrController[keyof typeof IrrController];
  middleware: Function[];
}

const routes: IrrRouteConfig[] = [
  { method: 'post', path: '/', handler: IrrController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: IrrController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: IrrController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: IrrController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: IrrController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
