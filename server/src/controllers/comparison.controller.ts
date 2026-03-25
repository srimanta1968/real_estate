import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ComparisonService } from '../services/comparison.service';

/**
 * Comparison set controller for multi-property comparisons.
 */
export const ComparisonController = {
  /**
   * POST /api/comparisons - Create a comparison set
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const { name } = req.body;
      if (!name) { res.status(400).json({ success: false, error: 'Name is required' }); return; }

      const set = await ComparisonService.create(userId, name);
      res.status(201).json({ success: true, data: { comparisonSet: set } });
    } catch (error) {
      console.error('ComparisonController create error:', error);
      res.status(500).json({ success: false, error: 'Failed to create comparison set' });
    }
  },

  /**
   * GET /api/comparisons - List user's comparison sets
   */
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const sets = await ComparisonService.listByUser(userId);
      res.json({ success: true, data: { comparisonSets: sets } });
    } catch (error) {
      console.error('ComparisonController list error:', error);
      res.status(500).json({ success: false, error: 'Failed to list comparison sets' });
    }
  },

  /**
   * GET /api/comparisons/:id - Get comparison set with properties
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const set = await ComparisonService.getWithItems(req.params.id, userId);
      if (!set) { res.status(404).json({ success: false, error: 'Comparison set not found' }); return; }

      res.json({ success: true, data: { comparisonSet: set } });
    } catch (error) {
      console.error('ComparisonController getById error:', error);
      res.status(500).json({ success: false, error: 'Failed to get comparison set' });
    }
  },

  /**
   * POST /api/comparisons/:id/add - Add property to comparison set
   */
  async addProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const { savedPropertyId } = req.body;
      if (!savedPropertyId) { res.status(400).json({ success: false, error: 'savedPropertyId is required' }); return; }

      const item = await ComparisonService.addProperty(req.params.id, userId, savedPropertyId);
      res.status(201).json({ success: true, data: { item } });
    } catch (error: any) {
      if (error.message?.includes('Free tier limit')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error.message === 'Comparison set not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      console.error('ComparisonController addProperty error:', error);
      res.status(500).json({ success: false, error: 'Failed to add property' });
    }
  },

  /**
   * DELETE /api/comparisons/:id/remove/:propertyId - Remove property from set
   */
  async removeProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const removed = await ComparisonService.removeProperty(req.params.id, userId, req.params.propertyId);
      if (!removed) { res.status(404).json({ success: false, error: 'Property not found in set' }); return; }

      res.json({ success: true, data: { message: 'Property removed from comparison set' } });
    } catch (error) {
      console.error('ComparisonController removeProperty error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove property' });
    }
  },

  /**
   * DELETE /api/comparisons/:id - Delete comparison set
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const deleted = await ComparisonService.delete(req.params.id, userId);
      if (!deleted) { res.status(404).json({ success: false, error: 'Comparison set not found' }); return; }

      res.json({ success: true, data: { message: 'Comparison set deleted' } });
    } catch (error) {
      console.error('ComparisonController delete error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete comparison set' });
    }
  },

  /**
   * POST /api/comparisons/:id/share - Generate share link
   */
  async share(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

      const result = await ComparisonService.generateShareLink(req.params.id, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('ComparisonController share error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate share link' });
    }
  },

  /**
   * GET /api/comparisons/shared/:token - View shared comparison (no auth)
   */
  async viewShared(req: Request, res: Response): Promise<void> {
    try {
      const set = await ComparisonService.getByShareToken(req.params.token);
      if (!set) { res.status(404).json({ success: false, error: 'Shared comparison not found or expired' }); return; }

      res.json({ success: true, data: { comparisonSet: set } });
    } catch (error) {
      console.error('ComparisonController viewShared error:', error);
      res.status(500).json({ success: false, error: 'Failed to get shared comparison' });
    }
  },
};

export default ComparisonController;
