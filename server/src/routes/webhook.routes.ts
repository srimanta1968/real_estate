import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const controller = new SubscriptionController();

// Stripe webhook — NO auth middleware, uses Stripe signature verification
router.post('/stripe', (req, res) => controller.handleWebhook(req, res));

export default router;
