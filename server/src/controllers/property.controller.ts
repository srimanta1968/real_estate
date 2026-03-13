import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PropertyService } from '../services/property.service';

export const PropertyController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { address, purchase_price } = req.body;

      if (!address || typeof address !== 'string' || !address.trim()) {
        res.status(400).json({ success: false, error: 'Address is required' });
        return;
      }

      if (purchase_price === undefined || isNaN(Number(purchase_price)) || Number(purchase_price) <= 0) {
        res.status(400).json({ success: false, error: 'Valid purchase price is required' });
        return;
      }

      const property = await PropertyService.create({
        address: address.trim(),
        purchase_price: Number(purchase_price),
      });

      res.status(201).json({ success: true, data: { property } });
    } catch (error) {
      console.error('PropertyController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const property = await PropertyService.findById(id);

      if (!property) {
        res.status(404).json({ success: false, error: 'Property not found' });
        return;
      }

      res.json({ success: true, data: { property } });
    } catch (error) {
      console.error('PropertyController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const properties = await PropertyService.findAll();
      res.json({ success: true, data: { properties } });
    } catch (error) {
      console.error('PropertyController getAll error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { address, purchase_price } = req.body;

      if (address !== undefined && (typeof address !== 'string' || !address.trim())) {
        res.status(400).json({ success: false, error: 'Address must be a non-empty string' });
        return;
      }

      if (purchase_price !== undefined && (isNaN(Number(purchase_price)) || Number(purchase_price) <= 0)) {
        res.status(400).json({ success: false, error: 'Purchase price must be a positive number' });
        return;
      }

      const property = await PropertyService.update(id, {
        address: address?.trim(),
        purchase_price: purchase_price !== undefined ? Number(purchase_price) : undefined,
      });

      if (!property) {
        res.status(404).json({ success: false, error: 'Property not found' });
        return;
      }

      res.json({ success: true, data: { property } });
    } catch (error) {
      console.error('PropertyController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await PropertyService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Property not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Property deleted' } });
    } catch (error) {
      console.error('PropertyController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default PropertyController;
