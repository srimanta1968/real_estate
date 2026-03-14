import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PdfService } from '../services/pdf.service';

/**
 * PDF download tracking controller.
 */
export const PdfController = {
  /**
   * POST /api/pdf/track-download
   */
  async trackDownload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { property_address } = req.body;

      const download = await PdfService.trackDownload(userId, property_address);
      const remaining = await PdfService.getRemainingDownloads(userId);

      res.status(201).json({
        success: true,
        data: {
          download,
          remaining,
        },
      });
    } catch (error: any) {
      if (error.message === 'Free tier limit reached') {
        res.status(403).json({
          success: false,
          error: 'You have used all 5 free PDF downloads. Please upgrade to continue.',
        });
        return;
      }
      console.error('Track download error:', error);
      res.status(500).json({ success: false, error: 'Failed to track download' });
    }
  },

  /**
   * GET /api/pdf/download-count
   */
  async getDownloadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const count = await PdfService.getDownloadCount(userId);
      const remaining = await PdfService.getRemainingDownloads(userId);

      res.status(200).json({
        success: true,
        data: {
          count,
          remaining,
          limit: 5,
        },
      });
    } catch (error) {
      console.error('Get download count error:', error);
      res.status(500).json({ success: false, error: 'Failed to get download count' });
    }
  },
};
