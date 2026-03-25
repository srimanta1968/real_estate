import crypto from 'crypto';
import { DataService } from './data.service';
import { config } from '../config/env';

interface ComparisonSetRecord {
  id: string;
  user_id: string;
  name: string;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ComparisonSetItemRecord {
  id: string;
  set_id: string;
  saved_property_id: string;
  display_order: number;
  added_at: string;
}

interface ComparisonSetWithItems extends ComparisonSetRecord {
  items: any[];
}

/**
 * Comparison set service for multi-property comparison.
 */
export const ComparisonService = {
  /**
   * Create a new comparison set
   */
  async create(userId: string, name: string): Promise<ComparisonSetRecord> {
    try {
      return await DataService.insertOne<ComparisonSetRecord>('comparison_sets', {
        user_id: userId,
        name,
      });
    } catch (error) {
      console.error('ComparisonService create error:', error);
      throw error;
    }
  },

  /**
   * List user's comparison sets
   */
  async listByUser(userId: string): Promise<ComparisonSetRecord[]> {
    try {
      return await DataService.findMany<ComparisonSetRecord>(
        'SELECT * FROM comparison_sets WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
    } catch (error) {
      console.error('ComparisonService listByUser error:', error);
      throw error;
    }
  },

  /**
   * Get a comparison set with its properties
   */
  async getWithItems(setId: string, userId: string): Promise<ComparisonSetWithItems | null> {
    try {
      const set = await DataService.findOne<ComparisonSetRecord>(
        'SELECT * FROM comparison_sets WHERE id = $1 AND user_id = $2',
        [setId, userId]
      );

      if (!set) return null;

      const items = await DataService.findMany(
        `SELECT csi.*, sp.property_name, sp.property_data, sp.financing_data, sp.expense_data
         FROM comparison_set_items csi
         JOIN saved_properties sp ON sp.id = csi.saved_property_id
         WHERE csi.set_id = $1
         ORDER BY csi.display_order ASC`,
        [setId]
      );

      return { ...set, items };
    } catch (error) {
      console.error('ComparisonService getWithItems error:', error);
      throw error;
    }
  },

  /**
   * Add a property to a comparison set (enforces tier limit)
   */
  async addProperty(setId: string, userId: string, savedPropertyId: string): Promise<ComparisonSetItemRecord> {
    try {
      const set = await DataService.findOne<ComparisonSetRecord>(
        'SELECT * FROM comparison_sets WHERE id = $1 AND user_id = $2',
        [setId, userId]
      );

      if (!set) throw new Error('Comparison set not found');

      const countResult = await DataService.findOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM comparison_set_items WHERE set_id = $1',
        [setId]
      );
      const currentCount = parseInt(countResult?.count || '0');
      const maxSize = config.freeTier.maxComparisonSize;

      if (currentCount >= maxSize) {
        throw new Error(`Free tier limit: maximum ${maxSize} properties per comparison set`);
      }

      const nextOrder = currentCount + 1;

      return await DataService.insertOne<ComparisonSetItemRecord>('comparison_set_items', {
        set_id: setId,
        saved_property_id: savedPropertyId,
        display_order: nextOrder,
      });
    } catch (error) {
      console.error('ComparisonService addProperty error:', error);
      throw error;
    }
  },

  /**
   * Remove a property from a comparison set
   */
  async removeProperty(setId: string, userId: string, savedPropertyId: string): Promise<boolean> {
    try {
      const set = await DataService.findOne<ComparisonSetRecord>(
        'SELECT id FROM comparison_sets WHERE id = $1 AND user_id = $2',
        [setId, userId]
      );

      if (!set) throw new Error('Comparison set not found');

      const count = await DataService.delete(
        'comparison_set_items',
        'set_id = $1 AND saved_property_id = $2',
        [setId, savedPropertyId]
      );
      return count > 0;
    } catch (error) {
      console.error('ComparisonService removeProperty error:', error);
      throw error;
    }
  },

  /**
   * Delete a comparison set
   */
  async delete(setId: string, userId: string): Promise<boolean> {
    try {
      const count = await DataService.delete(
        'comparison_sets',
        'id = $1 AND user_id = $2',
        [setId, userId]
      );
      return count > 0;
    } catch (error) {
      console.error('ComparisonService delete error:', error);
      throw error;
    }
  },

  /**
   * Generate a shareable link for a comparison set
   */
  async generateShareLink(setId: string, userId: string): Promise<{ token: string; expiresAt: string }> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const results = await DataService.update<ComparisonSetRecord>(
        'comparison_sets',
        { share_token: token, share_expires_at: expiresAt },
        'id = $1 AND user_id = $2',
        [setId, userId]
      );

      if (results.length === 0) throw new Error('Comparison set not found');

      return { token, expiresAt };
    } catch (error) {
      console.error('ComparisonService generateShareLink error:', error);
      throw error;
    }
  },

  /**
   * Get comparison set by share token (public access)
   */
  async getByShareToken(token: string): Promise<ComparisonSetWithItems | null> {
    try {
      const set = await DataService.findOne<ComparisonSetRecord>(
        'SELECT * FROM comparison_sets WHERE share_token = $1 AND share_expires_at > NOW()',
        [token]
      );

      if (!set) return null;

      const items = await DataService.findMany(
        `SELECT csi.*, sp.property_name, sp.property_data, sp.financing_data, sp.expense_data
         FROM comparison_set_items csi
         JOIN saved_properties sp ON sp.id = csi.saved_property_id
         WHERE csi.set_id = $1
         ORDER BY csi.display_order ASC`,
        [set.id]
      );

      return { ...set, items };
    } catch (error) {
      console.error('ComparisonService getByShareToken error:', error);
      throw error;
    }
  },
};

export default ComparisonService;
