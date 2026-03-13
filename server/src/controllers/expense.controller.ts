import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExpenseService } from '../services/expense.service';

export const ExpenseController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, property_tax } = req.body;

      if (property_tax === undefined || isNaN(Number(property_tax)) || Number(property_tax) < 0) {
        res.status(400).json({ success: false, error: 'Valid property tax amount is required' });
        return;
      }

      const expense = await ExpenseService.create({
        property_id,
        property_tax: Number(property_tax),
      });

      res.status(201).json({ success: true, data: { expense } });
    } catch (error) {
      console.error('ExpenseController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expense = await ExpenseService.findById(id);

      if (!expense) {
        res.status(404).json({ success: false, error: 'Expense record not found' });
        return;
      }

      res.json({ success: true, data: { expense } });
    } catch (error) {
      console.error('ExpenseController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const expenses = await ExpenseService.findByPropertyId(propertyId);
      res.json({ success: true, data: { expenses } });
    } catch (error) {
      console.error('ExpenseController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { property_tax } = req.body;

      if (property_tax !== undefined && (isNaN(Number(property_tax)) || Number(property_tax) < 0)) {
        res.status(400).json({ success: false, error: 'Property tax must be a non-negative number' });
        return;
      }

      const expense = await ExpenseService.update(id, {
        property_tax: property_tax !== undefined ? Number(property_tax) : undefined,
      });

      if (!expense) {
        res.status(404).json({ success: false, error: 'Expense record not found' });
        return;
      }

      res.json({ success: true, data: { expense } });
    } catch (error) {
      console.error('ExpenseController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ExpenseService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Expense record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Expense record deleted' } });
    } catch (error) {
      console.error('ExpenseController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default ExpenseController;
