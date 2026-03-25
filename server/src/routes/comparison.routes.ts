import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ComparisonController } from '../controllers/comparison.controller';

// @governance-tracked — API definitions added: POST /, GET /, GET /:id, POST /:id/add, DELETE /:id/remove/:propertyId, DELETE /:id, POST /:id/share, GET /shared/:token
const router: Router = Router();

// Public (no auth) - shared comparison view
router.get('/shared/:token', (req: Request, res: Response) => ComparisonController.viewShared(req, res));

// Authenticated routes
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.create(req, res));
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.list(req, res));
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.getById(req, res));
router.post('/:id/add', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.addProperty(req, res));
router.delete('/:id/remove/:propertyId', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.removeProperty(req, res));
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.delete(req, res));
router.post('/:id/share', authMiddleware, (req: AuthRequest, res: Response) => ComparisonController.share(req, res));

export default router;
