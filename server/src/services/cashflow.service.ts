import { DataService } from './data.service';

interface CashFlowRecord {
  id: string;
  property_id: number | null;
  cash_flow: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateCashFlowInput {
  property_id?: string;
  cash_flow: number;
}

interface UpdateCashFlowInput {
  cash_flow?: number;
}

export const CashFlowService = {
  async create(input: CreateCashFlowInput): Promise<CashFlowRecord> {
    try {
      const data: Record<string, any> = { cash_flow: input.cash_flow };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<CashFlowRecord>('cash_flow', data);
    } catch (error) {
      console.error('CashFlowService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<CashFlowRecord | null> {
    try {
      return await DataService.findOne<CashFlowRecord>(
        'SELECT * FROM cash_flow WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('CashFlowService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<CashFlowRecord[]> {
    try {
      return await DataService.findMany<CashFlowRecord>(
        'SELECT * FROM cash_flow WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('CashFlowService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateCashFlowInput): Promise<CashFlowRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.cash_flow !== undefined) data.cash_flow = input.cash_flow;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<CashFlowRecord>('cash_flow', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('CashFlowService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('cash_flow', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('CashFlowService delete error:', error);
      throw error;
    }
  },
};

export default CashFlowService;
