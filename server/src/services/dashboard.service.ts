import { DataService } from './data.service';

interface DashboardSummary {
  totalProperties: number;
  totalComparisons: number;
  totalSearches: number;
  recentProperties: any[];
  pdfDownloads: { count: number; remaining: number; limit: number };
  tier: string;
}

/**
 * Dashboard aggregation service for portfolio summary metrics.
 */
export const DashboardService = {
  /**
   * Get aggregated dashboard summary for a user
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    try {
      const [propsResult, compsResult, searchesResult, recentProps, downloadsResult, userResult] = await Promise.all([
        DataService.findOne<{ count: string }>('SELECT COUNT(*) as count FROM saved_properties WHERE user_id = $1', [userId]),
        DataService.findOne<{ count: string }>('SELECT COUNT(*) as count FROM comparison_sets WHERE user_id = $1', [userId]),
        DataService.findOne<{ count: string }>('SELECT COUNT(*) as count FROM property_searches WHERE user_id = $1', [userId]),
        DataService.findMany(
          'SELECT id, property_name, property_data, financing_data, expense_data, created_at FROM saved_properties WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
          [userId]
        ),
        DataService.findOne<{ count: string }>('SELECT COUNT(*) as count FROM pdf_downloads WHERE user_id = $1', [userId]),
        DataService.findOne<{ subscription_tier: string }>('SELECT subscription_tier FROM users WHERE id = $1', [userId]),
      ]);

      const downloadCount = parseInt(downloadsResult?.count || '0');

      return {
        totalProperties: parseInt(propsResult?.count || '0'),
        totalComparisons: parseInt(compsResult?.count || '0'),
        totalSearches: parseInt(searchesResult?.count || '0'),
        recentProperties: recentProps,
        pdfDownloads: {
          count: downloadCount,
          remaining: Math.max(0, 5 - downloadCount),
          limit: 5,
        },
        tier: userResult?.subscription_tier || 'free',
      };
    } catch (error) {
      console.error('DashboardService getSummary error:', error);
      throw error;
    }
  },
};

export default DashboardService;
