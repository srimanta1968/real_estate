import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SearchService } from '../services/search.service';

/**
 * Search controller handling property search and listing endpoints.
 */
export const SearchController = {
  /**
   * GET /api/search - Search properties (anonymous access allowed)
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { city, state, zip, type, minPrice, maxPrice, listedWithin, page, limit } = req.query;
      const userId = (req as AuthRequest).user?.userId;

      if (!city && !state && !zip) {
        res.status(400).json({ success: false, error: 'At least one of city, state, or zip is required' });
        return;
      }

      const results = await SearchService.search({
        city: city as string,
        state: state as string,
        zip: zip as string,
        propertyType: type as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        listedWithin: listedWithin ? Number(listedWithin) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      }, userId);

      res.json({ success: true, data: results });
    } catch (error) {
      console.error('SearchController search error:', error);
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  },

  /**
   * GET /api/search/:id - Get listing detail by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const listing = await SearchService.getListingById(id);

      if (!listing) {
        res.status(404).json({ success: false, error: 'Listing not found' });
        return;
      }

      res.json({ success: true, data: { listing } });
    } catch (error) {
      console.error('SearchController getById error:', error);
      res.status(500).json({ success: false, error: 'Failed to get listing' });
    }
  },

  /**
   * POST /api/search/save-query - Save a search query for re-running (auth required)
   */
  async saveQuery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { city, state, zip, propertyType, minPrice, maxPrice } = req.body;

      const saved = await SearchService.saveSearchQuery(userId, {
        city, state, zip, propertyType, minPrice, maxPrice,
      });

      res.status(201).json({ success: true, data: { search: saved } });
    } catch (error) {
      console.error('SearchController saveQuery error:', error);
      res.status(500).json({ success: false, error: 'Failed to save search' });
    }
  },

  /**
   * GET /api/search/my-searches - Get user's saved searches (auth required)
   */
  async mySearches(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const searches = await SearchService.getUserSearches(userId);
      res.json({ success: true, data: { searches } });
    } catch (error) {
      console.error('SearchController mySearches error:', error);
      res.status(500).json({ success: false, error: 'Failed to get searches' });
    }
  },
};

export default SearchController;
