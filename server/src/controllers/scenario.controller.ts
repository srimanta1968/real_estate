import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ScenarioService } from '../services/scenario.service';

export const ScenarioController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { property_id, scenario_type, comparison_value } = req.body;

      if (!scenario_type || typeof scenario_type !== 'string' || scenario_type.trim() === '') {
        res.status(400).json({ success: false, error: 'Valid scenario type is required' });
        return;
      }

      if (comparison_value === undefined || isNaN(Number(comparison_value))) {
        res.status(400).json({ success: false, error: 'Valid comparison value is required' });
        return;
      }

      const scenario = await ScenarioService.create({
        property_id,
        scenario_type: scenario_type.trim(),
        comparison_value: Number(comparison_value),
      });

      res.status(201).json({ success: true, data: { scenario } });
    } catch (error) {
      console.error('ScenarioController create error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scenario = await ScenarioService.findById(id);

      if (!scenario) {
        res.status(404).json({ success: false, error: 'Scenario record not found' });
        return;
      }

      res.json({ success: true, data: { scenario } });
    } catch (error) {
      console.error('ScenarioController getById error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const scenarios = await ScenarioService.findByPropertyId(propertyId);
      res.json({ success: true, data: { scenarios } });
    } catch (error) {
      console.error('ScenarioController getByProperty error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scenario_type, comparison_value } = req.body;

      if (scenario_type !== undefined && (typeof scenario_type !== 'string' || scenario_type.trim() === '')) {
        res.status(400).json({ success: false, error: 'Scenario type must be a non-empty string' });
        return;
      }

      if (comparison_value !== undefined && isNaN(Number(comparison_value))) {
        res.status(400).json({ success: false, error: 'Comparison value must be a valid number' });
        return;
      }

      const scenario = await ScenarioService.update(id, {
        scenario_type: scenario_type !== undefined ? scenario_type.trim() : undefined,
        comparison_value: comparison_value !== undefined ? Number(comparison_value) : undefined,
      });

      if (!scenario) {
        res.status(404).json({ success: false, error: 'Scenario record not found' });
        return;
      }

      res.json({ success: true, data: { scenario } });
    } catch (error) {
      console.error('ScenarioController update error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ScenarioService.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Scenario record not found' });
        return;
      }

      res.json({ success: true, data: { message: 'Scenario record deleted' } });
    } catch (error) {
      console.error('ScenarioController delete error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

export default ScenarioController;
