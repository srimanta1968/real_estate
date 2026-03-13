import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { VisualizationService } from '../services/visualization.service';

export const VisualizationController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, metric_name, value } = req.body;

      if (!metric_name || typeof metric_name !== 'string' || metric_name.trim() === '') {
        res.status(400).json({ success: false, error: 'Valid metric name is required' });
        return;
      }

      if (value === undefined || isNaN(Number(value))) {
        res.status(400).json({ success: false, error: 'Valid numeric value is required' });
        return;
      }

      const visualization = await VisualizationService.create({
        property_id,
        metric_name: metric_name.trim(),
        value: Number(value),
      });

      res.status(201).json({ success: true, data: { visualization } });
    } catch (error) {
      console.error('VisualizationController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const visualization = await VisualizationService.findById(id);

      if (!visualization) {
        res.status(404).json({ success: false, error: 'Visualization record not found' });
        return;
      }

      res.json({ success: true, data: { visualization } });
    } catch (error) {
      console.error('VisualizationController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const visualizations = await VisualizationService.findByPropertyId(propertyId);
      res.json({ success: true, data: { visualizations } });
    } catch (error) {
      console.error('VisualizationController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { metric_name, value } = req.body;

      if (metric_name !== undefined && (typeof metric_name !== 'string' || metric_name.trim() === '')) {
        res.status(400).json({ success: false, error: 'Metric name must be a non-empty string' });
        return;
      }

      if (value !== undefined && isNaN(Number(value))) {
        res.status(400).json({ success: false, error: 'Value must be a valid number' });
        return;
      }

      const visualization = await VisualizationService.update(id, {
        metric_name: metric_name !== undefined ? metric_name.trim() : undefined,
        value: value !== undefined ? Number(value) : undefined,
      });

      if (!visualization) {
        res.status(404).json({ success: false, error: 'Visualization record not found' });
        return;
      }

      res.json({ success: true, data: { visualization } });
    } catch (error) {
      console.error('VisualizationController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await VisualizationService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Visualization record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Visualization record deleted' } });
    } catch (error) {
      console.error('VisualizationController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default VisualizationController;
