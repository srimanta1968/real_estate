import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CapRateService } from '../services/caprate.service';

export const CapRateController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, cap_rate } = req.body;

      if (cap_rate === undefined || isNaN(Number(cap_rate))) {
        res.status(400).json({ success: false, error: 'Valid cap rate value is required' });
        return;
      }

      const capRate = await CapRateService.create({
        property_id,
        cap_rate: Number(cap_rate),
      });

      res.status(201).json({ success: true, data: { capRate } });
    } catch (error) {
      console.error('CapRateController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const capRate = await CapRateService.findById(id);

      if (!capRate) {
        res.status(404).json({ success: false, error: 'Cap rate record not found' });
        return;
      }

      res.json({ success: true, data: { capRate } });
    } catch (error) {
      console.error('CapRateController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const capRates = await CapRateService.findByPropertyId(propertyId);
      res.json({ success: true, data: { capRates } });
    } catch (error) {
      console.error('CapRateController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cap_rate } = req.body;

      if (cap_rate !== undefined && isNaN(Number(cap_rate))) {
        res.status(400).json({ success: false, error: 'Cap rate must be a valid number' });
        return;
      }

      const capRate = await CapRateService.update(id, {
        cap_rate: cap_rate !== undefined ? Number(cap_rate) : undefined,
      });

      if (!capRate) {
        res.status(404).json({ success: false, error: 'Cap rate record not found' });
        return;
      }

      res.json({ success: true, data: { capRate } });
    } catch (error) {
      console.error('CapRateController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await CapRateService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Cap rate record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Cap rate record deleted' } });
    } catch (error) {
      console.error('CapRateController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default CapRateController;
