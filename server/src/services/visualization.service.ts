import { DataService } from './data.service';

interface VisualizationRecord {
  id: string;
  property_id: number | null;
  metric_name: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateVisualizationInput {
  property_id?: string;
  metric_name: string;
  value: number;
}

interface UpdateVisualizationInput {
  metric_name?: string;
  value?: number;
}

export const VisualizationService = {
  async create(input: CreateVisualizationInput): Promise<VisualizationRecord> {
    try {
      const data: Record<string, any> = {
        metric_name: input.metric_name,
        value: input.value,
      };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<VisualizationRecord>('financial_visualization', data);
    } catch (error) {
      console.error('VisualizationService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<VisualizationRecord | null> {
    try {
      return await DataService.findOne<VisualizationRecord>(
        'SELECT * FROM financial_visualization WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('VisualizationService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<VisualizationRecord[]> {
    try {
      return await DataService.findMany<VisualizationRecord>(
        'SELECT * FROM financial_visualization WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('VisualizationService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateVisualizationInput): Promise<VisualizationRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.metric_name !== undefined) data.metric_name = input.metric_name;
      if (input.value !== undefined) data.value = input.value;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<VisualizationRecord>('financial_visualization', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('VisualizationService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('financial_visualization', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('VisualizationService delete error:', error);
      throw error;
    }
  },
};

export default VisualizationService;
