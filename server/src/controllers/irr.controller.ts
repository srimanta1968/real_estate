import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { IrrService } from '../services/irr.service';

export const IrrController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, irr } = req.body;

      if (irr === undefined || isNaN(Number(irr))) {
        res.status(400).json({ success: false, error: 'Valid IRR value is required' });
        return;
      }

      const irrRecord = await IrrService.create({
        property_id,
        irr: Number(irr),
      });

      res.status(201).json({ success: true, data: { irr: irrRecord } });
    } catch (error) {
      console.error('IrrController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const irrRecord = await IrrService.findById(id);

      if (!irrRecord) {
        res.status(404).json({ success: false, error: 'IRR record not found' });
        return;
      }

      res.json({ success: true, data: { irr: irrRecord } });
    } catch (error) {
      console.error('IrrController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const irrs = await IrrService.findByPropertyId(propertyId);
      res.json({ success: true, data: { irrs } });
    } catch (error) {
      console.error('IrrController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { irr } = req.body;

      if (irr !== undefined && isNaN(Number(irr))) {
        res.status(400).json({ success: false, error: 'IRR must be a valid number' });
        return;
      }

      const irrRecord = await IrrService.update(id, {
        irr: irr !== undefined ? Number(irr) : undefined,
      });

      if (!irrRecord) {
        res.status(404).json({ success: false, error: 'IRR record not found' });
        return;
      }

      res.json({ success: true, data: { irr: irrRecord } });
    } catch (error) {
      console.error('IrrController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await IrrService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'IRR record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'IRR record deleted' } });
    } catch (error) {
      console.error('IrrController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default IrrController;
