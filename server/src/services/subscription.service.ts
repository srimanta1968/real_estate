import { DataService } from './data.service';
import { stripe, PLANS, getPlanByPriceId } from '../config/stripe';
import { config } from '../config/env';

const dataService = DataService;

export class SubscriptionService {
  async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    const user = await dataService.findOne<any>('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);

    if (user?.stripe_customer_id) return user.stripe_customer_id;

    if (!stripe) throw new Error('Stripe is not configured');

    const customer = await stripe.customers.create({ email, metadata: { userId } });

    await dataService.query('UPDATE users SET stripe_customer_id = $2 WHERE id = $1', [userId, customer.id]);
    return customer.id;
  }

  async createCheckoutSession(userId: string, email: string, tier: string): Promise<string> {
    if (!stripe) throw new Error('Stripe is not configured');

    const plan = PLANS[tier];
    if (!plan || !plan.priceId) throw new Error(`Invalid plan: ${tier}`);

    const user = await dataService.findOne<any>(
      'SELECT stripe_subscription_id, subscription_tier FROM users WHERE id = $1',
      [userId]
    );

    // If user already has an active subscription, redirect to portal for upgrade/downgrade
    if (user?.stripe_subscription_id && user?.subscription_tier !== 'free') {
      return this.createPortalSession(userId);
    }

    // New subscription — create Checkout Session
    const customerId = await this.getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${config.clientUrl}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/subscription/cancelled`,
      subscription_data: { metadata: { userId, tier } },
      metadata: { userId, tier },
    });

    return session.url || '';
  }

  async createPortalSession(userId: string): Promise<string> {
    if (!stripe) throw new Error('Stripe is not configured');

    const user = await dataService.findOne<any>('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    if (!user?.stripe_customer_id) throw new Error('No Stripe customer found');

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${config.clientUrl}/settings/subscription`,
    });

    return session.url;
  }

  async handleWebhookEvent(event: any): Promise<void> {
    // Log event to billing_events table
    const userId = await this.getUserIdFromEvent(event);
    await dataService.query(
      `INSERT INTO billing_events (user_id, stripe_event_id, event_type, payload) VALUES ($1, $2, $3, $4) ON CONFLICT (stripe_event_id) DO NOTHING`,
      [userId, event.id, event.type, JSON.stringify(event.data)]
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private async getUserIdFromEvent(event: any): Promise<string | null> {
    const customerId = event.data?.object?.customer;
    if (!customerId) return null;
    const user = await dataService.findOne<any>('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
    return user?.id || null;
  }

  private async handleCheckoutComplete(session: any): Promise<void> {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;
    if (!userId || !tier) return;

    const plan = PLANS[tier];
    if (!plan) return;

    await dataService.query(
      `UPDATE users SET subscription_tier = $2, subscription_status = 'active', stripe_subscription_id = $3, credits_limit = $4, credits_used_this_period = 0 WHERE id = $1`,
      [userId, tier, session.subscription, plan.creditsPerMonth]
    );
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    const user = await dataService.findOne<any>('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
    if (!user) return;

    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plan = priceId ? getPlanByPriceId(priceId) : null;

    if (plan) {
      await dataService.query(
        `UPDATE users SET subscription_tier = $2, credits_limit = $3, subscription_status = $4 WHERE id = $1`,
        [user.id, plan.tier, plan.creditsPerMonth, subscription.status === 'active' ? 'active' : subscription.status]
      );
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const customerId = subscription.customer;
    await dataService.query(
      `UPDATE users SET subscription_tier = 'free', subscription_status = 'cancelled', stripe_subscription_id = NULL, credits_limit = 1, current_period_start = NULL, current_period_end = NULL WHERE stripe_customer_id = $1`,
      [customerId]
    );
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    const customerId = invoice.customer;
    const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : null;
    const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null;

    await dataService.query(
      `UPDATE users SET credits_used_this_period = 0, current_period_start = $2, current_period_end = $3 WHERE stripe_customer_id = $1`,
      [customerId, periodStart, periodEnd]
    );
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    const customerId = invoice.customer;
    await dataService.query(
      `UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = $1`,
      [customerId]
    );
  }

  async getUserSubscription(userId: string): Promise<any> {
    return dataService.findOne(
      `SELECT subscription_tier, subscription_status, credits_used_this_period, credits_limit, lifetime_report_used, current_period_start, current_period_end FROM users WHERE id = $1`,
      [userId]
    );
  }
}
