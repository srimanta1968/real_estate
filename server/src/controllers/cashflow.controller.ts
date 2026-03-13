import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CashFlowService } from '../services/cashflow.service';

export const CashFlowController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, cash_flow } = req.body;

      if (cash_flow === undefined || isNaN(Number(cash_flow))) {
        res.status(400).json({ success: false, error: 'Valid cash flow value is required' });
        return;
      }

      const cashFlow = await CashFlowService.create({
        property_id,
        cash_flow: Number(cash_flow),
      });

      res.status(201).json({ success: true, data: { cashFlow } });
    } catch (error) {
      console.error('CashFlowController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cashFlow = await CashFlowService.findById(id);

      if (!cashFlow) {
        res.status(404).json({ success: false, error: 'Cash flow record not found' });
        return;
      }

      res.json({ success: true, data: { cashFlow } });
    } catch (error) {
      console.error('CashFlowController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const cashFlows = await CashFlowService.findByPropertyId(propertyId);
      res.json({ success: true, data: { cashFlows } });
    } catch (error) {
      console.error('CashFlowController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cash_flow } = req.body;

      if (cash_flow !== undefined && isNaN(Number(cash_flow))) {
        res.status(400).json({ success: false, error: 'Cash flow must be a valid number' });
        return;
      }

      const cashFlow = await CashFlowService.update(id, {
        cash_flow: cash_flow !== undefined ? Number(cash_flow) : undefined,
      });

      if (!cashFlow) {
        res.status(404).json({ success: false, error: 'Cash flow record not found' });
        return;
      }

      res.json({ success: true, data: { cashFlow } });
    } catch (error) {
      console.error('CashFlowController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await CashFlowService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Cash flow record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Cash flow record deleted' } });
    } catch (error) {
      console.error('CashFlowController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default CashFlowController;
