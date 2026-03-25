import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { DashboardController } from '../controllers/dashboard.controller';

// @governance-tracked — API definitions added: GET /summary
const router: Router = Router();

router.get('/summary', authMiddleware, (req: AuthRequest, res: Response) => DashboardController.getSummary(req, res));

export default router;
