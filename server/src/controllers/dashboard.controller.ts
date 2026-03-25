import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DashboardService } from '../services/dashboard.service';

/**
 * Dashboard controller for user portfolio summary.
 */
export const DashboardController = {
  /**
   * GET /api/dashboard/summary - Get aggregated dashboard metrics
   */
  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const summary = await DashboardService.getSummary(userId);
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('DashboardController getSummary error:', error);
      res.status(500).json({ success: false, error: 'Failed to get dashboard summary' });
    }
  },
};

export default DashboardController;
