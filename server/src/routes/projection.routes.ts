import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ProjectionController } from '../controllers/projection.controller';

interface ProjectionRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof ProjectionController[keyof typeof ProjectionController];
  middleware: Function[];
}

const routes: ProjectionRouteConfig[] = [
  { method: 'post', path: '/', handler: ProjectionController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: ProjectionController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: ProjectionController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: ProjectionController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: ProjectionController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
