import { DataService } from './data.service';

interface FinancingRecord {
  id: string;
  property_id: number | null;
  loan_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateFinancingInput {
  property_id?: string;
  loan_amount: number;
}

interface UpdateFinancingInput {
  loan_amount?: number;
}

export const FinancingService = {
  async create(input: CreateFinancingInput): Promise<FinancingRecord> {
    try {
      const data: Record<string, any> = { loan_amount: input.loan_amount };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<FinancingRecord>('financing_info', data);
    } catch (error) {
      console.error('FinancingService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<FinancingRecord | null> {
    try {
      return await DataService.findOne<FinancingRecord>(
        'SELECT * FROM financing_info WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('FinancingService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<FinancingRecord[]> {
    try {
      return await DataService.findMany<FinancingRecord>(
        'SELECT * FROM financing_info WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('FinancingService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateFinancingInput): Promise<FinancingRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.loan_amount !== undefined) data.loan_amount = input.loan_amount;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<FinancingRecord>('financing_info', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('FinancingService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('financing_info', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('FinancingService delete error:', error);
      throw error;
    }
  },
};

export default FinancingService;
