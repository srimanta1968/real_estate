import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { VisualizationController } from '../controllers/visualization.controller';

interface VisualizationRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof VisualizationController[keyof typeof VisualizationController];
  middleware: Function[];
}

const routes: VisualizationRouteConfig[] = [
  { method: 'post', path: '/', handler: VisualizationController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: VisualizationController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: VisualizationController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: VisualizationController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: VisualizationController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
