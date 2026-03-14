import { DataService } from './data.service';

interface PdfDownloadRecord {
  id: string;
  user_id: string;
  property_address: string | null;
  downloaded_at: string;
}

const FREE_TIER_LIMIT = 5;

/**
 * PDF download tracking service.
 * Uses DataService for all database operations.
 */
export const PdfService = {
  /**
   * Record a new PDF download for a user
   */
  async trackDownload(userId: string, propertyAddress?: string): Promise<PdfDownloadRecord> {
    try {
      const count = await this.getDownloadCount(userId);
      if (count >= FREE_TIER_LIMIT) {
        throw new Error('Free tier limit reached');
      }

      const download = await DataService.insertOne<PdfDownloadRecord>('pdf_downloads', {
        user_id: userId,
        property_address: propertyAddress || null,
      });
      return download;
    } catch (error) {
      if (error instanceof Error && error.message === 'Free tier limit reached') {
        throw error;
      }
      console.error('PdfService trackDownload error:', error);
      throw error;
    }
  },

  /**
   * Get the number of PDFs downloaded by a user
   */
  async getDownloadCount(userId: string): Promise<number> {
    try {
      const result = await DataService.findOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM pdf_downloads WHERE user_id = $1',
        [userId]
      );
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      console.error('PdfService getDownloadCount error:', error);
      throw error;
    }
  },

  /**
   * Get remaining free downloads for a user
   */
  async getRemainingDownloads(userId: string): Promise<number> {
    const count = await this.getDownloadCount(userId);
    return Math.max(FREE_TIER_LIMIT - count, 0);
  },
};

export default PdfService;
