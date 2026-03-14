import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { PdfController } from '../controllers/pdf.controller';

/**
 * PDF download tracking routes.
 * API Definitions: tests/api_definitions/pdf/track-download.json, tests/api_definitions/pdf/download-count.json
 */
const router: Router = Router();

router.post('/track-download', authMiddleware, (req: AuthRequest, res: Response) => PdfController.trackDownload(req, res));
router.get('/download-count', authMiddleware, (req: AuthRequest, res: Response) => PdfController.getDownloadCount(req, res));

export default router;
