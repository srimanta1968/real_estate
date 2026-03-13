import { DataService } from './data.service';

interface ScenarioRecord {
  id: string;
  property_id: number | null;
  scenario_type: string | null;
  comparison_value: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateScenarioInput {
  property_id?: string;
  scenario_type: string;
  comparison_value: number;
}

interface UpdateScenarioInput {
  scenario_type?: string;
  comparison_value?: number;
}

export const ScenarioService = {
  async create(input: CreateScenarioInput): Promise<ScenarioRecord> {
    try {
      const data: Record<string, any> = {
        scenario_type: input.scenario_type,
        comparison_value: input.comparison_value,
      };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<ScenarioRecord>('scenario_comparison', data);
    } catch (error) {
      console.error('ScenarioService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<ScenarioRecord | null> {
    try {
      return await DataService.findOne<ScenarioRecord>(
        'SELECT * FROM scenario_comparison WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('ScenarioService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<ScenarioRecord[]> {
    try {
      return await DataService.findMany<ScenarioRecord>(
        'SELECT * FROM scenario_comparison WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('ScenarioService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateScenarioInput): Promise<ScenarioRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.scenario_type !== undefined) data.scenario_type = input.scenario_type;
      if (input.comparison_value !== undefined) data.comparison_value = input.comparison_value;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<ScenarioRecord>('scenario_comparison', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('ScenarioService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('scenario_comparison', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('ScenarioService delete error:', error);
      throw error;
    }
  },
};

export default ScenarioService;
