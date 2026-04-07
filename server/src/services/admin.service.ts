import { DataService } from './data.service';
import { PLANS } from '../config/stripe';

export const AdminService = {
  /**
   * Verify that a user has admin role
   */
  async verifyAdmin(userId: string): Promise<boolean> {
    const user = await DataService.findOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    return user?.role === 'admin';
  },

  /**
   * Dashboard statistics
   */
  async getDashboardStats() {
    const totalUsers = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE role != 'admin'"
    );
    const activeUsers = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE is_active = true AND role != 'admin'"
    );
    const suspendedUsers = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE is_active = false AND role != 'admin'"
    );
    const recentSignups = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days' AND role != 'admin'"
    );

    // Plan breakdown
    const planBreakdown = await DataService.findMany<{ subscription_tier: string; count: string }>(
      "SELECT COALESCE(subscription_tier, 'free') as subscription_tier, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY subscription_tier ORDER BY count DESC"
    );

    // Recent feedback count
    const pendingFeedback = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM feedback WHERE status = 'new'"
    );

    return {
      totalUsers: parseInt(totalUsers?.count || '0'),
      activeUsers: parseInt(activeUsers?.count || '0'),
      suspendedUsers: parseInt(suspendedUsers?.count || '0'),
      recentSignups: parseInt(recentSignups?.count || '0'),
      planBreakdown: planBreakdown.map(p => ({ tier: p.subscription_tier, count: parseInt(p.count) })),
      pendingFeedback: parseInt(pendingFeedback?.count || '0'),
    };
  },

  /**
   * List all users with pagination and search
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE role != 'admin'";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (email ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`;
    }

    const countResult = await DataService.findOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const users = await DataService.findMany(
      `SELECT id, email, first_name, last_name, role, is_active, email_verified,
              subscription_tier, subscription_status, credits_used_this_period, credits_limit,
              lifetime_report_used, oauth_provider, last_login, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      users,
      total: parseInt(countResult?.count || '0'),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult?.count || '0') / limit),
    };
  },

  /**
   * Get single user details
   */
  async getUser(userId: string) {
    const user = await DataService.findOne(
      `SELECT id, email, first_name, last_name, role, is_active, email_verified,
              subscription_tier, subscription_status, stripe_customer_id,
              credits_used_this_period, credits_limit, lifetime_report_used,
              oauth_provider, last_login, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) throw new Error('User not found');

    // Get credit usage history
    const creditHistory = await DataService.findMany(
      `SELECT * FROM credit_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    return { ...user, creditHistory };
  },

  /**
   * Suspend a user account
   */
  async suspendUser(userId: string) {
    const result = await DataService.update('users', { is_active: false }, 'id = $1', [userId]);
    return result[0];
  },

  /**
   * Activate a user account
   */
  async activateUser(userId: string) {
    const result = await DataService.update('users', { is_active: true }, 'id = $1', [userId]);
    return result[0];
  },

  /**
   * Grant trial property credits to a user
   */
  async grantTrialCredits(adminUserId: string, targetUserId: string, credits: number, reason?: string) {
    const user = await DataService.findOne<{ credits_limit: number; credits_used_this_period: number }>(
      'SELECT credits_limit, credits_used_this_period FROM users WHERE id = $1',
      [targetUserId]
    );
    if (!user) throw new Error('User not found');

    // Increase credit limit by the granted amount
    const newLimit = (user.credits_limit || 0) + credits;
    await DataService.query(
      'UPDATE users SET credits_limit = $1, lifetime_report_used = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newLimit, targetUserId]
    );

    // Log the grant
    await DataService.insertOne('admin_credit_grants', {
      admin_user_id: adminUserId,
      target_user_id: targetUserId,
      credits_granted: credits,
      reason: reason || 'Trial credit grant',
    });

    return { newLimit, creditsGranted: credits };
  },

  /**
   * Monthly revenue overview
   */
  async getRevenueOverview() {
    // Active subscribers by tier
    const subscribers = await DataService.findMany<{ subscription_tier: string; count: string }>(
      `SELECT subscription_tier, COUNT(*) as count
       FROM users
       WHERE subscription_status = 'active' AND subscription_tier != 'free'
       GROUP BY subscription_tier`
    );

    // Calculate MRR
    let mrr = 0;
    const breakdown = subscribers.map(s => {
      const plan = PLANS[s.subscription_tier];
      const tierRevenue = plan ? (plan.price / 100) * parseInt(s.count) : 0;
      mrr += tierRevenue;
      return {
        tier: s.subscription_tier,
        subscribers: parseInt(s.count),
        pricePerUser: plan ? plan.price / 100 : 0,
        monthlyRevenue: tierRevenue,
      };
    });

    // Total subscribers
    const totalSubscribers = await DataService.findOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active' AND subscription_tier != 'free'"
    );

    // Monthly signups trend (last 6 months)
    const signupTrend = await DataService.findMany<{ month: string; count: string }>(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
       FROM users WHERE role != 'admin'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC LIMIT 6`
    );

    // Credit usage stats
    const creditStats = await DataService.findOne<{ total_credits: string; total_reports: string }>(
      `SELECT COALESCE(SUM(credits_consumed), 0) as total_credits, COUNT(*) as total_reports
       FROM credit_usage
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );

    return {
      mrr,
      totalSubscribers: parseInt(totalSubscribers?.count || '0'),
      breakdown,
      signupTrend: signupTrend.map(s => ({ month: s.month, signups: parseInt(s.count) })),
      monthlyCreditsUsed: parseInt(creditStats?.total_credits || '0'),
      monthlyReportsGenerated: parseInt(creditStats?.total_reports || '0'),
    };
  },

  /**
   * Get all feedback (admin view)
   */
  async getFeedback(page: number = 1, limit: number = 20, status?: string) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      whereClause = `WHERE f.status = $${params.length}`;
    }

    const countResult = await DataService.findOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM feedback f ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const feedback = await DataService.findMany(
      `SELECT f.*, u.email as user_email, u.first_name, u.last_name
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      feedback,
      total: parseInt(countResult?.count || '0'),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult?.count || '0') / limit),
    };
  },

  /**
   * Update feedback status and notes
   */
  async updateFeedback(feedbackId: string, data: { status?: string; admin_notes?: string }) {
    const updates: Record<string, any> = {};
    if (data.status) updates.status = data.status;
    if (data.admin_notes !== undefined) updates.admin_notes = data.admin_notes;

    const result = await DataService.update('feedback', updates, 'id = $1', [feedbackId]);
    return result[0];
  },

  /**
   * Log an onboarding email sent by admin
   */
  async logOnboardingEmail(adminUserId: string, recipientUserId: string, subject: string, body: string) {
    return DataService.insertOne('admin_email_log', {
      admin_user_id: adminUserId,
      recipient_user_id: recipientUserId,
      email_type: 'onboarding',
      subject,
      body,
      status: 'sent',
    });
  },

  /**
   * Get onboarding email log
   */
  async getEmailLog(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const emails = await DataService.findMany(
      `SELECT el.*, u.email as recipient_email, u.first_name as recipient_first_name
       FROM admin_email_log el
       JOIN users u ON el.recipient_user_id = u.id
       ORDER BY el.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return emails;
  },
};

export default AdminService;
