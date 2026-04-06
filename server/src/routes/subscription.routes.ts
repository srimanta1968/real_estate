import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new SubscriptionController();

// Authenticated endpoints
router.post('/create-checkout', authMiddleware, (req, res) => controller.createCheckout(req, res));
router.post('/create-portal', authMiddleware, (req, res) => controller.createPortal(req, res));
router.get('/usage', authMiddleware, (req, res) => controller.getUsage(req, res));
router.get('/check-credits', authMiddleware, (req, res) => controller.checkCredits(req, res));
router.post('/consume-credits', authMiddleware, (req, res) => controller.consumeCredits(req, res));

export default router;
