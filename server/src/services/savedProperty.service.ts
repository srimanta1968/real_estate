import { DataService } from './data.service';

interface SavedPropertyRecord {
  id: string;
  user_id: string;
  property_name: string | null;
  property_data: Record<string, any>;
  financing_data: Record<string, any>;
  expense_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SavePropertyInput {
  userId: string;
  propertyData: Record<string, any>;
  financingData: Record<string, any>;
  expenseData: Record<string, any>;
}

/**
 * Saved property configuration service.
 * Uses DataService for all database operations.
 */
export const SavedPropertyService = {
  /**
   * Save a property configuration for a user
   */
  async save(input: SavePropertyInput): Promise<SavedPropertyRecord> {
    try {
      const propertyName = input.propertyData?.address || 'Untitled Property';

      const property = await DataService.insertOne<SavedPropertyRecord>('saved_properties', {
        user_id: input.userId,
        property_name: propertyName,
        property_data: JSON.stringify(input.propertyData),
        financing_data: JSON.stringify(input.financingData),
        expense_data: JSON.stringify(input.expenseData),
      });
      return property;
    } catch (error) {
      console.error('SavedPropertyService save error:', error);
      throw error;
    }
  },

  /**
   * List all saved properties for a user
   */
  async listByUser(userId: string): Promise<SavedPropertyRecord[]> {
    try {
      return await DataService.findMany<SavedPropertyRecord>(
        'SELECT * FROM saved_properties WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    } catch (error) {
      console.error('SavedPropertyService listByUser error:', error);
      throw error;
    }
  },

  /**
   * Get a specific property config by ID (ensures user ownership)
   */
  async getById(id: string, userId: string): Promise<SavedPropertyRecord | null> {
    try {
      return await DataService.findOne<SavedPropertyRecord>(
        'SELECT * FROM saved_properties WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    } catch (error) {
      console.error('SavedPropertyService getById error:', error);
      throw error;
    }
  },
};

export default SavedPropertyService;
