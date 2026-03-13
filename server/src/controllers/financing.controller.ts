import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { FinancingService } from '../services/financing.service';

export const FinancingController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, loan_amount } = req.body;

      if (loan_amount === undefined || isNaN(Number(loan_amount)) || Number(loan_amount) <= 0) {
        res.status(400).json({ success: false, error: 'Valid loan amount is required' });
        return;
      }

      const financing = await FinancingService.create({
        property_id,
        loan_amount: Number(loan_amount),
      });

      res.status(201).json({ success: true, data: { financing } });
    } catch (error) {
      console.error('FinancingController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const financing = await FinancingService.findById(id);

      if (!financing) {
        res.status(404).json({ success: false, error: 'Financing record not found' });
        return;
      }

      res.json({ success: true, data: { financing } });
    } catch (error) {
      console.error('FinancingController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const financings = await FinancingService.findByPropertyId(propertyId);
      res.json({ success: true, data: { financings } });
    } catch (error) {
      console.error('FinancingController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { loan_amount } = req.body;

      if (loan_amount !== undefined && (isNaN(Number(loan_amount)) || Number(loan_amount) <= 0)) {
        res.status(400).json({ success: false, error: 'Loan amount must be a positive number' });
        return;
      }

      const financing = await FinancingService.update(id, {
        loan_amount: loan_amount !== undefined ? Number(loan_amount) : undefined,
      });

      if (!financing) {
        res.status(404).json({ success: false, error: 'Financing record not found' });
        return;
      }

      res.json({ success: true, data: { financing } });
    } catch (error) {
      console.error('FinancingController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await FinancingService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Financing record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Financing record deleted' } });
    } catch (error) {
      console.error('FinancingController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default FinancingController;
