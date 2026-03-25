import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { PdfController } from '../controllers/pdf.controller';

// @governance-tracked — API definitions added: POST /track-download, GET /download-count
const router: Router = Router();

router.post('/track-download', authMiddleware, (req: AuthRequest, res: Response) => PdfController.trackDownload(req, res));
router.get('/download-count', authMiddleware, (req: AuthRequest, res: Response) => PdfController.getDownloadCount(req, res));

export default router;
