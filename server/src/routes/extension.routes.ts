import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ExtensionController } from '../controllers/extension.controller';

// @governance-tracked — API definitions added: POST /ingest
const router: Router = Router();

router.post('/ingest', authMiddleware, (req: AuthRequest, res: Response) => ExtensionController.ingest(req, res));

export default router;
