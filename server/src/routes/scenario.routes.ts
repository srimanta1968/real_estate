import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ScenarioController } from '../controllers/scenario.controller';

interface ScenarioRouteConfig {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: typeof ScenarioController[keyof typeof ScenarioController];
  middleware: Function[];
}

const routes: ScenarioRouteConfig[] = [
  { method: 'post', path: '/', handler: ScenarioController.create, middleware: [authMiddleware] },
  { method: 'get', path: '/:id', handler: ScenarioController.getById, middleware: [authMiddleware] },
  { method: 'get', path: '/property/:propertyId', handler: ScenarioController.getByProperty, middleware: [authMiddleware] },
  { method: 'put', path: '/:id', handler: ScenarioController.update, middleware: [authMiddleware] },
  { method: 'delete', path: '/:id', handler: ScenarioController.delete, middleware: [authMiddleware] },
];

const router = Router();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middleware as any[], route.handler as any);
});

export default router;
