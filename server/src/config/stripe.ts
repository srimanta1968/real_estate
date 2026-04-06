import { config } from './env';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');
export const stripe: any = config.stripe.secretKey
  ? new StripeLib(config.stripe.secretKey)
  : null;

export interface PlanDetails {
  tier: string;
  name: string;
  price: number;
  creditsPerMonth: number;
  priceId: string;
  isLifetime?: boolean;
}

export const PLANS: Record<string, PlanDetails> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    creditsPerMonth: 1,
    priceId: '',
    isLifetime: true,
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: 2500, // $25.00 in cents
    creditsPerMonth: 10,
    priceId: config.stripe.prices.starter,
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    price: 7500, // $75.00 in cents
    creditsPerMonth: 50,
    priceId: config.stripe.prices.growth,
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 10000, // $100.00 in cents
    creditsPerMonth: 100,
    priceId: config.stripe.prices.premium,
  },
};

export function getPlanByTier(tier: string): PlanDetails | undefined {
  return PLANS[tier];
}

export function getPlanByPriceId(priceId: string): PlanDetails | undefined {
  return Object.values(PLANS).find(p => p.priceId === priceId);
}
