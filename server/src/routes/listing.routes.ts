import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ListingController } from '../controllers/listing.controller';

// @governance-tracked — API definitions added: POST /save, GET /my-listings
const router: Router = Router();

router.post('/save', authMiddleware, (req: AuthRequest, res: Response) => ListingController.save(req, res));
router.get('/my-listings', authMiddleware, (req: AuthRequest, res: Response) => ListingController.myListings(req, res));

export default router;
