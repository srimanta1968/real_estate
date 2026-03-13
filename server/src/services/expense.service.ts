import { DataService } from './data.service';

interface ExpenseRecord {
  id: string;
  property_id: number | null;
  property_tax: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateExpenseInput {
  property_id?: string;
  property_tax: number;
}

interface UpdateExpenseInput {
  property_tax?: number;
}

export const ExpenseService = {
  async create(input: CreateExpenseInput): Promise<ExpenseRecord> {
    try {
      const data: Record<string, any> = { property_tax: input.property_tax };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<ExpenseRecord>('expense_info', data);
    } catch (error) {
      console.error('ExpenseService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<ExpenseRecord | null> {
    try {
      return await DataService.findOne<ExpenseRecord>(
        'SELECT * FROM expense_info WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('ExpenseService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<ExpenseRecord[]> {
    try {
      return await DataService.findMany<ExpenseRecord>(
        'SELECT * FROM expense_info WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );
    } catch (error) {
      console.error('ExpenseService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateExpenseInput): Promise<ExpenseRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.property_tax !== undefined) data.property_tax = input.property_tax;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<ExpenseRecord>('expense_info', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('ExpenseService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('expense_info', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('ExpenseService delete error:', error);
      throw error;
    }
  },
};

export default ExpenseService;
