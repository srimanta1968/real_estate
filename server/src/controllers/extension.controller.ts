import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SearchService } from '../services/search.service';

/**
 * Extension controller for Chrome extension data ingestion.
 */
export const ExtensionController = {
  /**
   * POST /api/extension/ingest - Receive extracted property data from Chrome extension
   */
  async ingest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { address, source, source_url } = req.body;

      if (!address) {
        res.status(400).json({ success: false, error: 'Address is required' });
        return;
      }

      const listing = await SearchService.saveListing(userId, {
        ...req.body,
        source: source || 'chrome_extension',
        source_url: source_url || '',
      });

      res.status(201).json({
        success: true,
        data: {
          listing,
          evaluateUrl: `/property/new?listingId=${listing.id}`,
        },
      });
    } catch (error) {
      console.error('ExtensionController ingest error:', error);
      res.status(500).json({ success: false, error: 'Failed to ingest property data' });
    }
  },
};

export default ExtensionController;
