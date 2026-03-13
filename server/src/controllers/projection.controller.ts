import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectionService } from '../services/projection.service';

export const ProjectionController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, year, rental_income } = req.body;

      if (year === undefined || isNaN(Number(year)) || Number(year) < 1) {
        res.status(400).json({ success: false, error: 'Valid year is required' });
        return;
      }

      if (rental_income === undefined || isNaN(Number(rental_income))) {
        res.status(400).json({ success: false, error: 'Valid rental income is required' });
        return;
      }

      const projection = await ProjectionService.create({
        property_id,
        year: Number(year),
        rental_income: Number(rental_income),
      });

      res.status(201).json({ success: true, data: { projection } });
    } catch (error) {
      console.error('ProjectionController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const projection = await ProjectionService.findById(id);

      if (!projection) {
        res.status(404).json({ success: false, error: 'Projection record not found' });
        return;
      }

      res.json({ success: true, data: { projection } });
    } catch (error) {
      console.error('ProjectionController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const projections = await ProjectionService.findByPropertyId(propertyId);
      res.json({ success: true, data: { projections } });
    } catch (error) {
      console.error('ProjectionController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { year, rental_income } = req.body;

      if (year !== undefined && (isNaN(Number(year)) || Number(year) < 1)) {
        res.status(400).json({ success: false, error: 'Year must be a positive integer' });
        return;
      }

      if (rental_income !== undefined && isNaN(Number(rental_income))) {
        res.status(400).json({ success: false, error: 'Rental income must be a valid number' });
        return;
      }

      const projection = await ProjectionService.update(id, {
        year: year !== undefined ? Number(year) : undefined,
        rental_income: rental_income !== undefined ? Number(rental_income) : undefined,
      });

      if (!projection) {
        res.status(404).json({ success: false, error: 'Projection record not found' });
        return;
      }

      res.json({ success: true, data: { projection } });
    } catch (error) {
      console.error('ProjectionController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ProjectionService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Projection record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Projection record deleted' } });
    } catch (error) {
      console.error('ProjectionController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default ProjectionController;
