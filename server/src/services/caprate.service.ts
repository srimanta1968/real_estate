import { DataService } from './data.service';

interface CapRateRecord {
  id: string;
  property_id: number | null;
  cap_rate: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateCapRateInput {
  property_id?: string;
  cap_rate: number;
}

interface UpdateCapRateInput {
  cap_rate?: number;
}

export const CapRateService = {
  async create(input: CreateCapRateInput): Promise<CapRateRecord> {
    try {
      const data: Record<string, any> = { cap_rate: input.cap_rate };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<CapRateRecord>('cap_rate', data);
    } catch (error) {
      console.error('CapRateService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<CapRateRecord | null> {
    try {
      return await DataService.findOne<CapRateRecord>(
        'SELECT * FROM cap_rate WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('CapRateService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<CapRateRecord[]> {
    try {
      return await DataService.findMany<CapRateRecord>(
        'SELECT * FROM cap_rate WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('CapRateService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateCapRateInput): Promise<CapRateRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.cap_rate !== undefined) data.cap_rate = input.cap_rate;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<CapRateRecord>('cap_rate', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('CapRateService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('cap_rate', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('CapRateService delete error:', error);
      throw error;
    }
  },
};

export default CapRateService;
