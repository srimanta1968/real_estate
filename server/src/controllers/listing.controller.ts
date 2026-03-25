import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SearchService } from '../services/search.service';

/**
 * Listing controller for extracted/saved property listings.
 */
export const ListingController = {
  /**
   * POST /api/listings/save - Save an extracted listing
   */
  async save(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const listing = await SearchService.saveListing(userId, req.body);
      res.status(201).json({ success: true, data: { listing } });
    } catch (error) {
      console.error('ListingController save error:', error);
      res.status(500).json({ success: false, error: 'Failed to save listing' });
    }
  },

  /**
   * GET /api/listings/my-listings - Get user's extracted listings
   */
  async myListings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const listings = await SearchService.getUserListings(userId);
      res.json({ success: true, data: { listings } });
    } catch (error) {
      console.error('ListingController myListings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get listings' });
    }
  },
};

export default ListingController;
