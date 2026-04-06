import { DataService } from './data.service';
import { PLANS } from '../config/stripe';

const dataService = DataService;

interface CreditCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
  used: number;
}

interface CreditUsageRecord {
  id: string;
  property_address: string;
  report_type: string;
  credits_consumed: number;
  created_at: string;
}

export class CreditService {
  async checkCredits(userId: string, creditsNeeded: number): Promise<CreditCheck> {
    const user = await dataService.findOne<any>(
      'SELECT subscription_tier, credits_used_this_period, credits_limit, lifetime_report_used FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return { allowed: false, remaining: 0, limit: 0, tier: 'free', used: 0 };
    }

    const tier = user.subscription_tier || 'free';
    const limit = user.credits_limit || 1;
    const used = user.credits_used_this_period || 0;

    if (tier === 'free') {
      const allowed = !user.lifetime_report_used && creditsNeeded <= 1;
      return { allowed, remaining: user.lifetime_report_used ? 0 : 1, limit: 1, tier, used: user.lifetime_report_used ? 1 : 0 };
    }

    const remaining = Math.max(limit - used, 0);
    return { allowed: remaining >= creditsNeeded, remaining, limit, tier, used };
  }

  async consumeCredits(
    userId: string,
    creditsNeeded: number,
    reportType: 'single' | 'comparison',
    propertyAddresses: string[],
    comparisonSetId?: string,
  ): Promise<{ success: boolean; remaining: number; error?: string }> {
    const check = await this.checkCredits(userId, creditsNeeded);
    if (!check.allowed) {
      return { success: false, remaining: check.remaining, error: 'Insufficient credits. Please upgrade your plan.' };
    }

    const pool = dataService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert credit_usage rows (one per property)
      for (const address of propertyAddresses) {
        await client.query(
          `INSERT INTO credit_usage (user_id, property_address, report_type, comparison_set_id, credits_consumed) VALUES ($1, $2, $3, $4, 1)`,
          [userId, address, reportType, comparisonSetId || null]
        );
      }

      // Update user credit count
      if (check.tier === 'free') {
        await client.query('UPDATE users SET lifetime_report_used = true, credits_used_this_period = credits_used_this_period + $2 WHERE id = $1', [userId, creditsNeeded]);
      } else {
        await client.query('UPDATE users SET credits_used_this_period = credits_used_this_period + $2 WHERE id = $1', [userId, creditsNeeded]);
      }

      await client.query('COMMIT');

      return { success: true, remaining: check.remaining - creditsNeeded };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getUsage(userId: string): Promise<{
    tier: string;
    used: number;
    limit: number;
    remaining: number;
    lifetimeReportUsed: boolean;
    periodStart: string | null;
    periodEnd: string | null;
    history: CreditUsageRecord[];
  }> {
    const user = await dataService.findOne<any>(
      `SELECT subscription_tier, credits_used_this_period, credits_limit, lifetime_report_used, current_period_start, current_period_end FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return { tier: 'free', used: 0, limit: 1, remaining: 1, lifetimeReportUsed: false, periodStart: null, periodEnd: null, history: [] };
    }

    const tier = user.subscription_tier || 'free';
    const used = user.credits_used_this_period || 0;
    const limit = user.credits_limit || PLANS[tier]?.creditsPerMonth || 1;
    const remaining = tier === 'free' ? (user.lifetime_report_used ? 0 : 1) : Math.max(limit - used, 0);

    const history = await dataService.findMany<CreditUsageRecord>(
      `SELECT id, property_address, report_type, credits_consumed, created_at FROM credit_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    return {
      tier,
      used,
      limit,
      remaining,
      lifetimeReportUsed: user.lifetime_report_used || false,
      periodStart: user.current_period_start,
      periodEnd: user.current_period_end,
      history,
    };
  }

  async resetCredits(userId: string, tier: string): Promise<void> {
    const plan = PLANS[tier];
    const limit = plan?.creditsPerMonth || 1;
    await dataService.query(
      'UPDATE users SET credits_used_this_period = 0, credits_limit = $2, subscription_tier = $3 WHERE id = $1',
      [userId, limit, tier]
    );
  }
}
