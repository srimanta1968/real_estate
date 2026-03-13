import { DataService } from './data.service';

interface PropertyRecord {
  id: string;
  address: string | null;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
}

interface CreatePropertyInput {
  address: string;
  purchase_price: number;
}

interface UpdatePropertyInput {
  address?: string;
  purchase_price?: number;
}

export const PropertyService = {
  async create(input: CreatePropertyInput): Promise<PropertyRecord> {
    try {
      return await DataService.insertOne<PropertyRecord>('property_info', {
        address: input.address,
        purchase_price: input.purchase_price,
      });
    } catch (error) {
      console.error('PropertyService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<PropertyRecord | null> {
    try {
      return await DataService.findOne<PropertyRecord>(
        'SELECT * FROM property_info WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('PropertyService findById error:', error);
      throw error;
    }
  },

  async findAll(): Promise<PropertyRecord[]> {
    try {
      return await DataService.findMany<PropertyRecord>(
        'SELECT * FROM property_info ORDER BY created_at DESC'
      );
    } catch (error) {
      console.error('PropertyService findAll error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdatePropertyInput): Promise<PropertyRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.address !== undefined) data.address = input.address;
      if (input.purchase_price !== undefined) data.purchase_price = input.purchase_price;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<PropertyRecord>('property_info', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('PropertyService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('property_info', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('PropertyService delete error:', error);
      throw error;
    }
  },
};

export default PropertyService;
