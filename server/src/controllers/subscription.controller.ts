import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { CreditService } from '../services/credit.service';
import { stripe } from '../config/stripe';
import type Stripe from 'stripe';
import { config } from '../config/env';

const subscriptionService = new SubscriptionService();
const creditService = new CreditService();

export class SubscriptionController {
  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { tier } = req.body;
      if (!tier || !['starter', 'growth', 'premium'].includes(tier)) {
        res.status(400).json({ success: false, error: 'Invalid tier. Must be starter, growth, or premium.' });
        return;
      }

      const user = (req as any).user;
      const url = await subscriptionService.createCheckoutSession(user.userId, user.email, tier);
      res.json({ success: true, data: { url } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createPortal(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const url = await subscriptionService.createPortalSession(user.userId);
      res.json({ success: true, data: { url } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const usage = await creditService.getUsage(user.userId);
      res.json({ success: true, data: usage });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async checkCredits(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const creditsNeeded = parseInt(req.query.credits as string) || 1;
      const check = await creditService.checkCredits(user.userId, creditsNeeded);
      res.json({ success: true, data: check });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async consumeCredits(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { creditsNeeded, reportType, propertyAddresses, comparisonSetId } = req.body;

      if (!creditsNeeded || !reportType || !propertyAddresses?.length) {
        res.status(400).json({ success: false, error: 'Missing required fields: creditsNeeded, reportType, propertyAddresses' });
        return;
      }

      const result = await creditService.consumeCredits(
        user.userId, creditsNeeded, reportType, propertyAddresses, comparisonSetId
      );

      if (!result.success) {
        res.status(403).json({ success: false, error: result.error, remaining: result.remaining });
        return;
      }

      res.json({ success: true, data: { remaining: result.remaining } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' });
        return;
      }

      const sig = req.headers['stripe-signature'] as string;
      if (!sig) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      const event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body,
        sig,
        config.stripe.webhookSecret
      );

      await subscriptionService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
}
