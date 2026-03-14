import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SavedPropertyService } from '../services/savedProperty.service';

/**
 * Saved property configuration controller.
 */
export const SavedPropertyController = {
  /**
   * POST /api/saved-properties/save
   */
  async save(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { property_data, financing_data, expense_data } = req.body;

      if (!property_data || !financing_data || !expense_data) {
        res.status(400).json({
          success: false,
          error: 'property_data, financing_data, and expense_data are required',
        });
        return;
      }

      const property = await SavedPropertyService.save({
        userId,
        propertyData: property_data,
        financingData: financing_data,
        expenseData: expense_data,
      });

      res.status(201).json({
        success: true,
        data: { property },
      });
    } catch (error) {
      console.error('Save property error:', error);
      res.status(500).json({ success: false, error: 'Failed to save property' });
    }
  },

  /**
   * GET /api/saved-properties/my-properties
   */
  async listMyProperties(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const properties = await SavedPropertyService.listByUser(userId);

      res.status(200).json({
        success: true,
        data: { properties },
      });
    } catch (error) {
      console.error('List properties error:', error);
      res.status(500).json({ success: false, error: 'Failed to list properties' });
    }
  },

  /**
   * GET /api/saved-properties/:id/config
   */
  async getConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const property = await SavedPropertyService.getById(id, userId);

      if (!property) {
        res.status(404).json({ success: false, error: 'Property not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { property },
      });
    } catch (error) {
      console.error('Get property config error:', error);
      res.status(500).json({ success: false, error: 'Failed to get property config' });
    }
  },
};
