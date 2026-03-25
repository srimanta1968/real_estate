import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { SearchController } from '../controllers/search.controller';

// @governance-tracked — API definitions added: GET /search, GET /search/:id, POST /search/save-query, GET /search/my-searches
const router: Router = Router();

// Anonymous access - no auth required for searching
router.get('/', (req: Request, res: Response) => SearchController.search(req, res));
router.get('/my-searches', authMiddleware, (req: AuthRequest, res: Response) => SearchController.mySearches(req, res));
router.get('/:id', (req: Request, res: Response) => SearchController.getById(req, res));
router.post('/save-query', authMiddleware, (req: AuthRequest, res: Response) => SearchController.saveQuery(req, res));

export default router;
