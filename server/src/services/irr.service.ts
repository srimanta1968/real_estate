import { DataService } from './data.service';

interface IrrRecord {
  id: string;
  property_id: number | null;
  irr: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateIrrInput {
  property_id?: string;
  irr: number;
}

interface UpdateIrrInput {
  irr?: number;
}

export const IrrService = {
  async create(input: CreateIrrInput): Promise<IrrRecord> {
    try {
      const data: Record<string, any> = { irr: input.irr };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<IrrRecord>('irr', data);
    } catch (error) {
      console.error('IrrService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<IrrRecord | null> {
    try {
      return await DataService.findOne<IrrRecord>(
        'SELECT * FROM irr WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('IrrService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<IrrRecord[]> {
    try {
      return await DataService.findMany<IrrRecord>(
        'SELECT * FROM irr WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('IrrService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateIrrInput): Promise<IrrRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.irr !== undefined) data.irr = input.irr;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<IrrRecord>('irr', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('IrrService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('irr', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('IrrService delete error:', error);
      throw error;
    }
  },
};

export default IrrService;
