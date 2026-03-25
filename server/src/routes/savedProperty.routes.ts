import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { SavedPropertyController } from '../controllers/savedProperty.controller';

// @governance-tracked — API definitions added: POST /save, GET /my-properties, GET /:id/config
const router: Router = Router();

router.post('/save', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.save(req, res));
router.get('/my-properties', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.listMyProperties(req, res));
router.get('/:id/config', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.getConfig(req, res));

export default router;
