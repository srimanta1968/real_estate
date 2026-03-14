import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { SavedPropertyController } from '../controllers/savedProperty.controller';

/**
 * Saved property configuration routes.
 * API Definitions: tests/api_definitions/saved-properties/save.json,
 *   tests/api_definitions/saved-properties/my-properties.json,
 *   tests/api_definitions/saved-properties/get-config.json
 */
const router: Router = Router();

router.post('/save', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.save(req, res));
router.get('/my-properties', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.listMyProperties(req, res));
router.get('/:id/config', authMiddleware, (req: AuthRequest, res: Response) => SavedPropertyController.getConfig(req, res));

export default router;
